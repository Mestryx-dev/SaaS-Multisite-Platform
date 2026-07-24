import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { domain, site } from "../../db/schema.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";

const attachSchema = z.object({
  siteId: z.string().uuid(),
  hostname: z
    .string()
    .min(3)
    .max(253)
    .regex(/^[a-z0-9.-]+$/i),
  isPrimary: z.boolean().optional(),
});

export function domainRoutes(db: Db, auth: Auth) {
  const app = new Hono();

  app.post("/domains", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = attachSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const [siteRow] = await db
      .select()
      .from(site)
      .where(eq(site.id, parsed.data.siteId))
      .limit(1);
    if (!siteRow) {
      return apiError(c, 404, "NOT_FOUND", "Site not found");
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "admin",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }

    const token = `mx-verify-${randomBytes(16).toString("hex")}`;
    const [created] = await db
      .insert(domain)
      .values({
        siteId: siteRow.id,
        hostname: parsed.data.hostname.toLowerCase(),
        isPrimary: parsed.data.isPrimary ?? false,
        verificationStatus: "pending",
        verificationToken: token,
      })
      .returning();

    return c.json(
      {
        domain: created,
        dns: {
          type: "TXT",
          name: `_mestryx-challenge.${parsed.data.hostname}`,
          value: token,
        },
      },
      201,
    );
  });

  app.post("/domains/:domainId/verify", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const domainId = c.req.param("domainId");
    const [row] = await db.select().from(domain).where(eq(domain.id, domainId)).limit(1);
    if (!row) {
      return apiError(c, 404, "NOT_FOUND", "Domain not found");
    }
    const [siteRow] = await db.select().from(site).where(eq(site.id, row.siteId)).limit(1);
    if (!siteRow) {
      return apiError(c, 404, "NOT_FOUND", "Site not found");
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "admin",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }

    // Staging stub: accept body `{ force: true }` or matching token hash for tests
    const body = (await c.req.json().catch(() => ({}))) as {
      force?: boolean;
      token?: string;
    };
    const ok =
      body.force === true ||
      (typeof body.token === "string" && body.token === row.verificationToken);

    if (!ok) {
      await db
        .update(domain)
        .set({ verificationStatus: "failed" })
        .where(eq(domain.id, row.id));
      return apiError(
        c,
        400,
        "VERIFY_FAILED",
        "DNS TXT not confirmed (pass force:true in non-prod or matching token)",
      );
    }

    const [updated] = await db
      .update(domain)
      .set({
        verificationStatus: "verified",
        verifiedAt: new Date(),
      })
      .where(eq(domain.id, row.id))
      .returning();

    return c.json({ domain: updated });
  });

  app.get("/sites/:siteId/domains", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.param("siteId");
    const [siteRow] = await db.select().from(site).where(eq(site.id, siteId)).limit(1);
    if (!siteRow) {
      return apiError(c, 404, "NOT_FOUND", "Site not found");
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "viewer",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }
    const domains = await db.select().from(domain).where(eq(domain.siteId, siteId));
    return c.json({ domains });
  });

  return app;
}
