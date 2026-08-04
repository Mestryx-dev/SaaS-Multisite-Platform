import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { site, siteBanner } from "../../db/schema.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";

const createSchema = z.object({
  organizationId: z.string().uuid(),
  siteId: z.string().uuid(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).nullable().optional(),
  imageUrl: z.string().url().nullable().optional().or(z.literal("")),
  href: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

const updateSchema = createSchema
  .partial()
  .omit({ organizationId: true, siteId: true });

export function bannerRoutes(db: Db, auth: Auth) {
  const app = new Hono();

  app.get("/organizations/:orgId/sites/:siteId/banners", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const siteId = c.req.param("siteId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const [siteRow] = await db
      .select()
      .from(site)
      .where(and(eq(site.id, siteId), eq(site.organizationId, orgId)))
      .limit(1);
    if (!siteRow) return apiError(c, 404, "NOT_FOUND", "Site not found");

    const banners = await db
      .select()
      .from(siteBanner)
      .where(eq(siteBanner.siteId, siteId))
      .orderBy(asc(siteBanner.sortOrder), asc(siteBanner.createdAt));
    return c.json({ banners });
  });

  app.post("/banners", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = createSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      parsed.data.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const [siteRow] = await db
      .select()
      .from(site)
      .where(
        and(
          eq(site.id, parsed.data.siteId),
          eq(site.organizationId, parsed.data.organizationId),
        ),
      )
      .limit(1);
    if (!siteRow) return apiError(c, 404, "NOT_FOUND", "Site not found");

    const imageUrl =
      parsed.data.imageUrl === "" ? null : (parsed.data.imageUrl ?? null);

    const [row] = await db
      .insert(siteBanner)
      .values({
        organizationId: parsed.data.organizationId,
        siteId: parsed.data.siteId,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle ?? null,
        imageUrl,
        href: parsed.data.href ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
        active: parsed.data.active ?? true,
      })
      .returning();
    return c.json({ banner: row }, 201);
  });

  app.patch("/banners/:bannerId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [existing] = await db
      .select()
      .from(siteBanner)
      .where(eq(siteBanner.id, c.req.param("bannerId")))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Banner not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const parsed = updateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const data = parsed.data;
    const imageUrl =
      data.imageUrl === ""
        ? null
        : data.imageUrl !== undefined
          ? data.imageUrl
          : undefined;

    const [row] = await db
      .update(siteBanner)
      .set({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(data.href !== undefined ? { href: data.href } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        updatedAt: new Date(),
      })
      .where(eq(siteBanner.id, existing.id))
      .returning();
    return c.json({ banner: row });
  });

  app.delete("/banners/:bannerId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [existing] = await db
      .select()
      .from(siteBanner)
      .where(eq(siteBanner.id, c.req.param("bannerId")))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Banner not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    await db.delete(siteBanner).where(eq(siteBanner.id, existing.id));
    return c.json({ ok: true });
  });

  /** Public active banners for storefront home */
  app.get("/public/sites/:siteId/banners", async (c) => {
    const siteId = c.req.param("siteId");
    const banners = await db
      .select({
        id: siteBanner.id,
        title: siteBanner.title,
        subtitle: siteBanner.subtitle,
        imageUrl: siteBanner.imageUrl,
        href: siteBanner.href,
        sortOrder: siteBanner.sortOrder,
      })
      .from(siteBanner)
      .where(and(eq(siteBanner.siteId, siteId), eq(siteBanner.active, true)))
      .orderBy(asc(siteBanner.sortOrder), asc(siteBanner.createdAt));
    return c.json({ banners });
  });

  return app;
}
