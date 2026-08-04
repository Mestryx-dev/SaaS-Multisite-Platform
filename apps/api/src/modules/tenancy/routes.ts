import { and, count, eq, ne } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { membership, organization, plan, site } from "../../db/schema.js";
import { apiError } from "../../lib/errors.js";
import {
  modulesAllowedSchema,
  normalizeThemeJson,
  themeJsonSchema,
} from "../../lib/theme.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";
import { ensureLegalPages } from "../cms/legal-pages.js";

const createOrgSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const createSiteSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  defaultLocale: z.string().min(2).max(10).optional(),
});

const updateOrgSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  modulesAllowed: modulesAllowedSchema.optional(),
});

const updateSiteSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  defaultLocale: z.enum(["en", "fr"]).optional(),
  cookieConsentEnabled: z.boolean().optional(),
  cookiePolicyPath: z
    .string()
    .min(1)
    .max(120)
    .regex(/^\/[a-z0-9/-]*$/)
    .optional(),
  seoDefaultTitle: z.string().max(200).nullable().optional(),
  seoDefaultDescription: z.string().max(500).nullable().optional(),
  themeJson: themeJsonSchema.nullable().optional(),
  umamiWebsiteId: z.string().min(1).max(120).nullable().optional(),
  umamiSrc: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
});

async function requireSession(auth: Auth, headers: Headers) {
  return auth.api.getSession({ headers });
}

export function tenancyRoutes(db: Db, auth: Auth) {
  const app = new Hono();

  app.post("/organizations", async (c) => {
    const session = await requireSession(auth, c.req.raw.headers);
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = createOrgSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const [org] = await db
      .insert(organization)
      .values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        planId: "free",
        modulesAllowed: ["cms"],
      })
      .returning();

    if (!org) {
      return apiError(c, 500, "CREATE_FAILED", "Could not create organization");
    }

    await db.insert(membership).values({
      organizationId: org.id,
      userId: session.user.id,
      role: "owner",
    });

    return c.json({ organization: org }, 201);
  });

  app.get("/organizations", async (c) => {
    const session = await requireSession(auth, c.req.raw.headers);
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }

    const rows = await db
      .select({
        organization,
        role: membership.role,
      })
      .from(membership)
      .innerJoin(organization, eq(membership.organizationId, organization.id))
      .where(eq(membership.userId, session.user.id));

    return c.json({
      organizations: rows.map((r) => ({ ...r.organization, role: r.role })),
    });
  });

  app.patch("/organizations/:organizationId", async (c) => {
    const session = await requireSession(auth, c.req.raw.headers);
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const organizationId = c.req.param("organizationId");
    const access = await assertOrgRole(db, session.user.id, organizationId, "admin");
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }
    const parsed = updateOrgSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId))
      .limit(1);
    if (!org) {
      return apiError(c, 404, "NOT_FOUND", "Organization not found");
    }

    if (parsed.data.modulesAllowed) {
      const planId = org.planId ?? "free";
      const [planRow] = await db
        .select()
        .from(plan)
        .where(eq(plan.id, planId))
        .limit(1);
      const planMods = (planRow?.modulesAllowed ?? ["cms"]) as string[];
      const disallowed = parsed.data.modulesAllowed.filter(
        (m) => !planMods.includes(m),
      );
      if (disallowed.length > 0) {
        return apiError(
          c,
          403,
          "MODULE_NOT_IN_PLAN",
          `Plan does not allow: ${disallowed.join(", ")}`,
        );
      }
    }

    const [updated] = await db
      .update(organization)
      .set({
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.modulesAllowed !== undefined
          ? { modulesAllowed: parsed.data.modulesAllowed }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(organization.id, organizationId))
      .returning();

    return c.json({ organization: updated });
  });

  app.post("/sites", async (c) => {
    const session = await requireSession(auth, c.req.raw.headers);
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = createSiteSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const access = await assertOrgRole(
      db,
      session.user.id,
      parsed.data.organizationId,
      "editor",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, parsed.data.organizationId))
      .limit(1);
    if (!org) {
      return apiError(c, 404, "NOT_FOUND", "Organization not found");
    }

    const planId = org.planId ?? "free";
    const [planRow] = await db.select().from(plan).where(eq(plan.id, planId)).limit(1);
    const maxSites = planRow?.maxSites ?? 1;

    const siteCountRows = await db
      .select({ value: count() })
      .from(site)
      .where(and(eq(site.organizationId, org.id), ne(site.status, "archived")));
    const siteCount = Number(siteCountRows[0]?.value ?? 0);

    if (siteCount >= maxSites) {
      return apiError(c, 403, "PLAN_LIMIT", `Plan allows at most ${maxSites} sites`);
    }

    const modules = (org.modulesAllowed ?? []) as string[];
    if (!modules.includes("cms")) {
      return apiError(c, 403, "MODULE_DISABLED", "CMS module not enabled");
    }

    const [created] = await db
      .insert(site)
      .values({
        organizationId: org.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        defaultLocale: parsed.data.defaultLocale ?? "en",
        status: "draft",
      })
      .returning();

    if (created) {
      await ensureLegalPages(db, created.id);
    }

    return c.json({ site: created }, 201);
  });

  app.patch("/sites/:siteId", async (c) => {
    const session = await requireSession(auth, c.req.raw.headers);
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.param("siteId");
    const [existing] = await db
      .select()
      .from(site)
      .where(eq(site.id, siteId))
      .limit(1);
    if (!existing) {
      return apiError(c, 404, "NOT_FOUND", "Site not found");
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.organizationId,
      "editor",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }
    const parsed = updateSiteSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const data = parsed.data;
    const themeValue =
      data.themeJson === undefined
        ? undefined
        : data.themeJson === null
          ? null
          : (normalizeThemeJson(data.themeJson as Record<string, unknown>) ??
            data.themeJson);

    const [updated] = await db
      .update(site)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.defaultLocale !== undefined
          ? { defaultLocale: data.defaultLocale }
          : {}),
        ...(data.cookieConsentEnabled !== undefined
          ? { cookieConsentEnabled: data.cookieConsentEnabled }
          : {}),
        ...(data.cookiePolicyPath !== undefined
          ? { cookiePolicyPath: data.cookiePolicyPath }
          : {}),
        ...(data.seoDefaultTitle !== undefined
          ? { seoDefaultTitle: data.seoDefaultTitle }
          : {}),
        ...(data.seoDefaultDescription !== undefined
          ? { seoDefaultDescription: data.seoDefaultDescription }
          : {}),
        ...(themeValue !== undefined ? { themeJson: themeValue } : {}),
        ...(data.umamiWebsiteId !== undefined
          ? { umamiWebsiteId: data.umamiWebsiteId }
          : {}),
        ...(data.umamiSrc !== undefined
          ? { umamiSrc: data.umamiSrc || null }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(site.id, siteId))
      .returning();
    return c.json({ site: updated });
  });

  app.post("/sites/:siteId/ensure-legal-pages", async (c) => {
    const session = await requireSession(auth, c.req.raw.headers);
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.param("siteId");
    const [existing] = await db
      .select()
      .from(site)
      .where(eq(site.id, siteId))
      .limit(1);
    if (!existing) {
      return apiError(c, 404, "NOT_FOUND", "Site not found");
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.organizationId,
      "editor",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }
    await ensureLegalPages(db, siteId);
    return c.json({ ok: true });
  });

  app.get("/organizations/:organizationId/sites", async (c) => {
    const session = await requireSession(auth, c.req.raw.headers);
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const organizationId = c.req.param("organizationId");
    const access = await assertOrgRole(db, session.user.id, organizationId, "viewer");
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }

    const sites = await db
      .select()
      .from(site)
      .where(eq(site.organizationId, organizationId));

    return c.json({ sites });
  });

  /** Tenant-scoped site fetch — used by isolation tests */
  app.get("/sites/:siteId", async (c) => {
    const session = await requireSession(auth, c.req.raw.headers);
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.param("siteId");
    const [row] = await db.select().from(site).where(eq(site.id, siteId)).limit(1);
    if (!row) {
      return apiError(c, 404, "NOT_FOUND", "Site not found");
    }
    const access = await assertOrgRole(db, session.user.id, row.organizationId, "viewer");
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }
    return c.json({ site: row });
  });

  return app;
}
