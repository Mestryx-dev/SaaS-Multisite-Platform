import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { page, site } from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import {
  signPreviewToken,
  verifyPreviewToken,
} from "../../lib/preview-token.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";

const upsertPageSchema = z.object({
  siteId: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(200),
  bodyJson: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(["draft", "published"]).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  ogImageUrl: z.string().url().optional().or(z.literal("")),
  canonicalPath: z.string().max(300).optional(),
  robots: z.string().max(64).optional(),
  jsonLd: z.record(z.string(), z.unknown()).optional(),
});

export function cmsRoutes(db: Db, auth: Auth, config: AppConfig) {
  const app = new Hono();

  app.post("/pages", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = upsertPageSchema.safeParse(await c.req.json());
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
      "editor",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }

    const [created] = await db
      .insert(page)
      .values({
        siteId: siteRow.id,
        slug: parsed.data.slug,
        title: parsed.data.title,
        bodyJson: parsed.data.bodyJson,
        status: parsed.data.status ?? "draft",
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
        ogImageUrl: parsed.data.ogImageUrl || null,
        canonicalPath: parsed.data.canonicalPath,
        robots: parsed.data.robots ?? "index,follow",
        jsonLd: parsed.data.jsonLd,
      })
      .returning();

    return c.json({ page: created }, 201);
  });

  app.get("/sites/:siteId/pages", async (c) => {
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
    const pages = await db.select().from(page).where(eq(page.siteId, siteId));
    return c.json({ pages });
  });

  app.get("/pages/:pageId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const pageId = c.req.param("pageId");
    const [row] = await db.select().from(page).where(eq(page.id, pageId)).limit(1);
    if (!row) {
      return apiError(c, 404, "NOT_FOUND", "Page not found");
    }
    const [siteRow] = await db.select().from(site).where(eq(site.id, row.siteId)).limit(1);
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
    return c.json({ page: row });
  });

  /** FB-087 — mint short-lived signed preview token */
  app.post("/pages/:pageId/preview-token", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const pageId = c.req.param("pageId");
    const [row] = await db.select().from(page).where(eq(page.id, pageId)).limit(1);
    if (!row) {
      return apiError(c, 404, "NOT_FOUND", "Page not found");
    }
    const [siteRow] = await db.select().from(site).where(eq(site.id, row.siteId)).limit(1);
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
    const token = signPreviewToken(config.betterAuthSecret, {
      pageId: row.id,
      siteId: row.siteId,
      slug: row.slug,
    });
    const path = `/${row.slug}?preview=${encodeURIComponent(token)}`;
    return c.json({
      token,
      path,
      siteSlug: siteRow.slug,
      expiresInSec: 30 * 60,
    });
  });

  const patchPageSchema = upsertPageSchema
    .omit({ siteId: true })
    .partial()
    .extend({
      slug: upsertPageSchema.shape.slug.optional(),
      title: upsertPageSchema.shape.title.optional(),
      bodyJson: z.record(z.string(), z.unknown()).optional(),
    });

  app.patch("/pages/:pageId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const pageId = c.req.param("pageId");
    const parsed = patchPageSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const [row] = await db.select().from(page).where(eq(page.id, pageId)).limit(1);
    if (!row) {
      return apiError(c, 404, "NOT_FOUND", "Page not found");
    }
    const [siteRow] = await db.select().from(site).where(eq(site.id, row.siteId)).limit(1);
    if (!siteRow) {
      return apiError(c, 404, "NOT_FOUND", "Site not found");
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "editor",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }

    const [updated] = await db
      .update(page)
      .set({
        ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.bodyJson !== undefined ? { bodyJson: parsed.data.bodyJson } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.seoTitle !== undefined ? { seoTitle: parsed.data.seoTitle } : {}),
        ...(parsed.data.seoDescription !== undefined
          ? { seoDescription: parsed.data.seoDescription }
          : {}),
        ...(parsed.data.ogImageUrl !== undefined
          ? { ogImageUrl: parsed.data.ogImageUrl || null }
          : {}),
        ...(parsed.data.canonicalPath !== undefined
          ? { canonicalPath: parsed.data.canonicalPath }
          : {}),
        ...(parsed.data.robots !== undefined ? { robots: parsed.data.robots } : {}),
        ...(parsed.data.jsonLd !== undefined ? { jsonLd: parsed.data.jsonLd } : {}),
        updatedAt: new Date(),
      })
      .where(eq(page.id, pageId))
      .returning();

    return c.json({ page: updated });
  });

  app.delete("/pages/:pageId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const pageId = c.req.param("pageId");
    const [row] = await db.select().from(page).where(eq(page.id, pageId)).limit(1);
    if (!row) {
      return apiError(c, 404, "NOT_FOUND", "Page not found");
    }
    const [siteRow] = await db.select().from(site).where(eq(site.id, row.siteId)).limit(1);
    if (!siteRow) {
      return apiError(c, 404, "NOT_FOUND", "Site not found");
    }
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "editor",
    );
    if (!access.ok) {
      return apiError(c, 403, access.code, access.message);
    }
    await db.delete(page).where(eq(page.id, pageId));
    return c.json({ ok: true });
  });

  app.get("/public/sites/:siteId/pages/:slug", async (c) => {
    const siteId = c.req.param("siteId");
    const slug = c.req.param("slug");
    const preview = c.req.query("preview");

    if (preview) {
      const payload = verifyPreviewToken(config.betterAuthSecret, preview);
      if (payload && payload.siteId === siteId && payload.slug === slug) {
        const [row] = await db
          .select()
          .from(page)
          .where(
            and(
              eq(page.id, payload.pageId),
              eq(page.siteId, siteId),
              eq(page.slug, slug),
            ),
          )
          .limit(1);
        if (row) {
          return c.json({ page: row, preview: true });
        }
      }
      return apiError(c, 404, "NOT_FOUND", "Page not found");
    }

    const [row] = await db
      .select()
      .from(page)
      .where(
        and(eq(page.siteId, siteId), eq(page.slug, slug), eq(page.status, "published")),
      )
      .limit(1);
    if (!row) {
      return apiError(c, 404, "NOT_FOUND", "Page not found");
    }
    return c.json({ page: row });
  });

  return app;
}
