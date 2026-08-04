import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { site, siteMenu, siteMenuItem } from "../../db/schema.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";

const locationSchema = z.enum(["header", "footer"]);

const itemCreateSchema = z.object({
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(500),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

const itemUpdateSchema = itemCreateSchema.partial();

async function ensureMenu(db: Db, siteId: string, location: "header" | "footer") {
  const [existing] = await db
    .select()
    .from(siteMenu)
    .where(and(eq(siteMenu.siteId, siteId), eq(siteMenu.location, location)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(siteMenu)
    .values({ siteId, location })
    .returning();
  return created!;
}

export function menuRoutes(db: Db, auth: Auth) {
  const app = new Hono();

  app.get("/sites/:siteId/menus", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.param("siteId");
    const [siteRow] = await db.select().from(site).where(eq(site.id, siteId)).limit(1);
    if (!siteRow) return apiError(c, 404, "NOT_FOUND", "Site not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const menus = await db.select().from(siteMenu).where(eq(siteMenu.siteId, siteId));
    const result = [];
    for (const menu of menus) {
      const items = await db
        .select()
        .from(siteMenuItem)
        .where(eq(siteMenuItem.menuId, menu.id))
        .orderBy(asc(siteMenuItem.sortOrder), asc(siteMenuItem.createdAt));
      result.push({ ...menu, items });
    }
    return c.json({ menus: result });
  });

  app.post("/sites/:siteId/menus/:location/items", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.param("siteId");
    const location = locationSchema.safeParse(c.req.param("location"));
    if (!location.success) {
      return apiError(c, 400, "VALIDATION_ERROR", "location must be header|footer");
    }
    const [siteRow] = await db.select().from(site).where(eq(site.id, siteId)).limit(1);
    if (!siteRow) return apiError(c, 404, "NOT_FOUND", "Site not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const parsed = itemCreateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const menu = await ensureMenu(db, siteId, location.data);
    const [item] = await db
      .insert(siteMenuItem)
      .values({
        menuId: menu.id,
        label: parsed.data.label,
        href: parsed.data.href,
        sortOrder: parsed.data.sortOrder ?? 0,
        active: parsed.data.active ?? true,
      })
      .returning();
    return c.json({ item, menu }, 201);
  });

  app.patch("/menu-items/:itemId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [existing] = await db
      .select({
        item: siteMenuItem,
        menu: siteMenu,
        site,
      })
      .from(siteMenuItem)
      .innerJoin(siteMenu, eq(siteMenuItem.menuId, siteMenu.id))
      .innerJoin(site, eq(siteMenu.siteId, site.id))
      .where(eq(siteMenuItem.id, c.req.param("itemId")))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Menu item not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.site.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const parsed = itemUpdateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const data = parsed.data;
    const [item] = await db
      .update(siteMenuItem)
      .set({
        ...(data.label !== undefined ? { label: data.label } : {}),
        ...(data.href !== undefined ? { href: data.href } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        updatedAt: new Date(),
      })
      .where(eq(siteMenuItem.id, existing.item.id))
      .returning();
    return c.json({ item });
  });

  app.delete("/menu-items/:itemId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [existing] = await db
      .select({
        item: siteMenuItem,
        menu: siteMenu,
        site,
      })
      .from(siteMenuItem)
      .innerJoin(siteMenu, eq(siteMenuItem.menuId, siteMenu.id))
      .innerJoin(site, eq(siteMenu.siteId, site.id))
      .where(eq(siteMenuItem.id, c.req.param("itemId")))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Menu item not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.site.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    await db.delete(siteMenuItem).where(eq(siteMenuItem.id, existing.item.id));
    return c.json({ ok: true });
  });

  /** Public menus for storefront */
  app.get("/public/sites/:siteId/menus", async (c) => {
    const siteId = c.req.param("siteId");
    const menus = await db.select().from(siteMenu).where(eq(siteMenu.siteId, siteId));
    const out: Record<string, Array<{ label: string; href: string }>> = {
      header: [],
      footer: [],
    };
    for (const menu of menus) {
      const items = await db
        .select({
          label: siteMenuItem.label,
          href: siteMenuItem.href,
        })
        .from(siteMenuItem)
        .where(
          and(eq(siteMenuItem.menuId, menu.id), eq(siteMenuItem.active, true)),
        )
        .orderBy(asc(siteMenuItem.sortOrder), asc(siteMenuItem.createdAt));
      out[menu.location] = items;
    }
    return c.json({ menus: out });
  });

  return app;
}
