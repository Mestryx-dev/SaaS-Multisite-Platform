import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import {
  membership,
  organization,
  organizationInvite,
  user,
} from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import { sendOrgInviteEmail } from "../email/send.js";
import type { Auth } from "../identity/auth.js";
import {
  assertOrgRole,
  type MembershipRole,
} from "../identity/rbac.js";

const inviteRoleSchema = z.enum(["admin", "editor", "viewer"]);

const createInviteSchema = z.object({
  email: z.string().email(),
  role: inviteRoleSchema,
});

const patchMemberSchema = z.object({
  role: z.enum(["owner", "admin", "editor", "viewer"]),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function countOwners(db: Db, organizationId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(membership)
    .where(
      and(
        eq(membership.organizationId, organizationId),
        eq(membership.role, "owner"),
      ),
    );
  return Number(row?.n ?? 0);
}

export function membersRoutes(db: Db, auth: Auth, config: AppConfig) {
  const app = new Hono();

  app.get("/organizations/:orgId/members", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const rows = await db
      .select({
        membership,
        email: user.email,
        name: user.name,
      })
      .from(membership)
      .innerJoin(user, eq(membership.userId, user.id))
      .where(eq(membership.organizationId, orgId));

    return c.json({
      members: rows.map((r) => ({
        id: r.membership.id,
        userId: r.membership.userId,
        role: r.membership.role,
        email: r.email,
        name: r.name,
        createdAt: r.membership.createdAt,
      })),
    });
  });

  app.patch("/organizations/:orgId/members/:membershipId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const membershipId = c.req.param("membershipId");
    const access = await assertOrgRole(db, session.user.id, orgId, "admin");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const parsed = patchMemberSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const [target] = await db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.id, membershipId),
          eq(membership.organizationId, orgId),
        ),
      )
      .limit(1);
    if (!target) return apiError(c, 404, "NOT_FOUND", "Member not found");

    if (target.role === "owner" && parsed.data.role !== "owner") {
      const owners = await countOwners(db, orgId);
      if (owners <= 1) {
        return apiError(
          c,
          400,
          "LAST_OWNER",
          "Cannot demote the last owner",
        );
      }
    }

    // Only owners can promote to owner
    if (parsed.data.role === "owner" && access.membership.role !== "owner") {
      return apiError(c, 403, "FORBIDDEN", "Only owners can assign owner role");
    }

    const [updated] = await db
      .update(membership)
      .set({ role: parsed.data.role as MembershipRole })
      .where(eq(membership.id, membershipId))
      .returning();

    return c.json({ member: updated });
  });

  app.delete("/organizations/:orgId/members/:membershipId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const membershipId = c.req.param("membershipId");
    const access = await assertOrgRole(db, session.user.id, orgId, "admin");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const [target] = await db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.id, membershipId),
          eq(membership.organizationId, orgId),
        ),
      )
      .limit(1);
    if (!target) return apiError(c, 404, "NOT_FOUND", "Member not found");

    if (target.role === "owner") {
      const owners = await countOwners(db, orgId);
      if (owners <= 1) {
        return apiError(
          c,
          400,
          "LAST_OWNER",
          "Cannot remove the last owner",
        );
      }
    }

    await db.delete(membership).where(eq(membership.id, membershipId));
    return c.json({ ok: true });
  });

  app.get("/organizations/:orgId/invites", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "admin");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const invites = await db
      .select()
      .from(organizationInvite)
      .where(
        and(
          eq(organizationInvite.organizationId, orgId),
          eq(organizationInvite.status, "pending"),
        ),
      );

    return c.json({ invites });
  });

  app.post("/organizations/:orgId/invites", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "admin");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const parsed = createInviteSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const email = normalizeEmail(parsed.data.email);
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);
    if (!org) return apiError(c, 404, "NOT_FOUND", "Organization not found");

    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (existingUser) {
      const [existingMem] = await db
        .select()
        .from(membership)
        .where(
          and(
            eq(membership.organizationId, orgId),
            eq(membership.userId, existingUser.id),
          ),
        )
        .limit(1);
      if (existingMem) {
        return apiError(c, 409, "ALREADY_MEMBER", "User is already a member");
      }
    }

    const [pending] = await db
      .select()
      .from(organizationInvite)
      .where(
        and(
          eq(organizationInvite.organizationId, orgId),
          eq(organizationInvite.email, email),
          eq(organizationInvite.status, "pending"),
        ),
      )
      .limit(1);
    if (pending) {
      return apiError(
        c,
        409,
        "INVITE_EXISTS",
        "A pending invite already exists for this email",
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [invite] = await db
      .insert(organizationInvite)
      .values({
        organizationId: orgId,
        email,
        role: parsed.data.role,
        token,
        invitedByUserId: session.user.id,
        status: "pending",
        expiresAt,
      })
      .returning();

    const acceptUrl = `${config.adminOrigin}/accept-invite?token=${encodeURIComponent(token)}`;
    await sendOrgInviteEmail(config, {
      to: email,
      organizationName: org.name,
      role: parsed.data.role,
      acceptUrl,
      inviterEmail: session.user.email,
    });

    return c.json({ invite, acceptUrl }, 201);
  });

  app.delete("/organizations/:orgId/invites/:inviteId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const inviteId = c.req.param("inviteId");
    const access = await assertOrgRole(db, session.user.id, orgId, "admin");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const [invite] = await db
      .select()
      .from(organizationInvite)
      .where(
        and(
          eq(organizationInvite.id, inviteId),
          eq(organizationInvite.organizationId, orgId),
        ),
      )
      .limit(1);
    if (!invite) return apiError(c, 404, "NOT_FOUND", "Invite not found");

    const [updated] = await db
      .update(organizationInvite)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(organizationInvite.id, inviteId))
      .returning();

    return c.json({ invite: updated });
  });

  app.get("/invites/:token", async (c) => {
    const token = c.req.param("token");
    const [invite] = await db
      .select()
      .from(organizationInvite)
      .where(eq(organizationInvite.token, token))
      .limit(1);
    if (!invite) return apiError(c, 404, "NOT_FOUND", "Invite not found");

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, invite.organizationId))
      .limit(1);

    const expired =
      invite.status === "pending" && invite.expiresAt.getTime() < Date.now();
    if (expired && invite.status === "pending") {
      await db
        .update(organizationInvite)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(organizationInvite.id, invite.id));
    }

    return c.json({
      invite: {
        email: invite.email,
        role: invite.role,
        status: expired ? "expired" : invite.status,
        expiresAt: invite.expiresAt,
        organizationName: org?.name ?? "Organization",
        organizationId: invite.organizationId,
      },
    });
  });

  app.post("/invites/:token/accept", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const token = c.req.param("token");
    const [invite] = await db
      .select()
      .from(organizationInvite)
      .where(eq(organizationInvite.token, token))
      .limit(1);
    if (!invite) return apiError(c, 404, "NOT_FOUND", "Invite not found");

    if (invite.status !== "pending") {
      return apiError(c, 400, "INVALID_STATUS", "Invite is not pending");
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      await db
        .update(organizationInvite)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(organizationInvite.id, invite.id));
      return apiError(c, 400, "EXPIRED", "Invite has expired");
    }

    if (normalizeEmail(session.user.email) !== invite.email) {
      return apiError(
        c,
        403,
        "EMAIL_MISMATCH",
        "Signed-in email does not match the invitation",
      );
    }

    const [existingMem] = await db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.organizationId, invite.organizationId),
          eq(membership.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!existingMem) {
      await db.insert(membership).values({
        organizationId: invite.organizationId,
        userId: session.user.id,
        role: invite.role,
      });
    }

    await db
      .update(organizationInvite)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(organizationInvite.id, invite.id));

    const [mem] = await db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.organizationId, invite.organizationId),
          eq(membership.userId, session.user.id),
        ),
      )
      .limit(1);

    return c.json({
      membership: mem,
      organizationId: invite.organizationId,
    });
  });

  return app;
}
