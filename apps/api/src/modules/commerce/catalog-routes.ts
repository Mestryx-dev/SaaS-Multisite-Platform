import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import {
  category,
  product,
  productCategory,
  productVariant,
  site,
} from "../../db/schema.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";

const categoryCreateSchema = z.object({
  organizationId: z.string().uuid(),
  siteId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  parentId: z.string().uuid().nullable().optional(),
});

const categoryPatchSchema = categoryCreateSchema
  .partial()
  .omit({ organizationId: true });

const variantCreateSchema = z.object({
  sku: z.string().min(1).max(64),
  optionsJson: z.record(z.string(), z.string()).default({}),
  priceCents: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

const variantPatchSchema = variantCreateSchema.partial();

async function loadSite(db: Db, siteId: string) {
  const [row] = await db.select().from(site).where(eq(site.id, siteId)).limit(1);
  return row ?? null;
}

export function catalogRoutes(db: Db, auth: Auth) {
  const app = new Hono();

  app.post("/categories", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = categoryCreateSchema.safeParse(await c.req.json());
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

    let publishSiteId: string | null = parsed.data.siteId ?? null;
    if (publishSiteId) {
      const siteRow = await loadSite(db, publishSiteId);
      if (!siteRow || siteRow.organizationId !== parsed.data.organizationId) {
        return apiError(c, 400, "VALIDATION_ERROR", "siteId must belong to organization");
      }
    }

    const [created] = await db
      .insert(category)
      .values({
        organizationId: parsed.data.organizationId,
        siteId: publishSiteId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        parentId: parsed.data.parentId ?? null,
      })
      .returning();
    return c.json({ category: created }, 201);
  });

  app.get("/organizations/:orgId/categories", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const categories = await db
      .select()
      .from(category)
      .where(eq(category.organizationId, orgId));
    return c.json({ categories });
  });

  app.patch("/categories/:categoryId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const categoryId = c.req.param("categoryId");
    const [existing] = await db
      .select()
      .from(category)
      .where(eq(category.id, categoryId))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Category not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const parsed = categoryPatchSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const [updated] = await db
      .update(category)
      .set({
        ...parsed.data,
        siteId:
          parsed.data.siteId === undefined ? existing.siteId : parsed.data.siteId,
        updatedAt: new Date(),
      })
      .where(eq(category.id, categoryId))
      .returning();
    return c.json({ category: updated });
  });

  app.delete("/categories/:categoryId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const categoryId = c.req.param("categoryId");
    const [existing] = await db
      .select()
      .from(category)
      .where(eq(category.id, categoryId))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Category not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    await db.delete(category).where(eq(category.id, categoryId));
    return c.json({ ok: true });
  });

  app.get("/products/:productId/categories", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const productId = c.req.param("productId");
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const rows = await db
      .select({ category })
      .from(productCategory)
      .innerJoin(category, eq(productCategory.categoryId, category.id))
      .where(eq(productCategory.productId, productId));
    return c.json({ categories: rows.map((r) => r.category) });
  });

  app.put("/products/:productId/categories", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const productId = c.req.param("productId");
    const body = z
      .object({ categoryIds: z.array(z.string().uuid()) })
      .safeParse(await c.req.json());
    if (!body.success) {
      return apiError(c, 400, "VALIDATION_ERROR", body.error.message);
    }
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    if (body.data.categoryIds.length > 0) {
      const cats = await db
        .select()
        .from(category)
        .where(inArray(category.id, body.data.categoryIds));
      if (
        cats.length !== body.data.categoryIds.length ||
        cats.some((cat) => cat.organizationId !== prod.organizationId)
      ) {
        return apiError(c, 400, "VALIDATION_ERROR", "Invalid categoryIds for organization");
      }
    }

    await db.delete(productCategory).where(eq(productCategory.productId, productId));
    if (body.data.categoryIds.length > 0) {
      await db.insert(productCategory).values(
        body.data.categoryIds.map((categoryId) => ({
          productId,
          categoryId,
        })),
      );
    }
    const rows = await db
      .select({ category })
      .from(productCategory)
      .innerJoin(category, eq(productCategory.categoryId, category.id))
      .where(eq(productCategory.productId, productId));
    return c.json({ categories: rows.map((r) => r.category) });
  });

  app.get("/public/sites/:siteId/categories", async (c) => {
    const siteId = c.req.param("siteId");
    const [siteRow] = await db
      .select()
      .from(site)
      .where(eq(site.id, siteId))
      .limit(1);
    if (!siteRow) return c.json({ categories: [] });
    const categories = await db
      .select()
      .from(category)
      .where(
        and(
          eq(category.organizationId, siteRow.organizationId),
          or(eq(category.siteId, siteId), isNull(category.siteId)),
        ),
      );
    return c.json({ categories });
  });

  app.get("/products/:productId/variants", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const productId = c.req.param("productId");
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const variants = await db
      .select()
      .from(productVariant)
      .where(eq(productVariant.productId, productId));
    return c.json({ variants });
  });

  app.post("/products/:productId/variants", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const productId = c.req.param("productId");
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const parsed = variantCreateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const [created] = await db
      .insert(productVariant)
      .values({
        productId,
        sku: parsed.data.sku,
        optionsJson: parsed.data.optionsJson,
        priceCents: parsed.data.priceCents,
        stock: parsed.data.stock,
        status: parsed.data.status ?? "active",
      })
      .returning();
    await syncProductStockFromVariants(db, productId);
    return c.json({ variant: created }, 201);
  });

  app.patch("/variants/:variantId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const variantId = c.req.param("variantId");
    const [existing] = await db
      .select()
      .from(productVariant)
      .where(eq(productVariant.id, variantId))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Variant not found");
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, existing.productId))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const parsed = variantPatchSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const [updated] = await db
      .update(productVariant)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(productVariant.id, variantId))
      .returning();
    await syncProductStockFromVariants(db, existing.productId);
    return c.json({ variant: updated });
  });

  app.delete("/variants/:variantId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const variantId = c.req.param("variantId");
    const [existing] = await db
      .select()
      .from(productVariant)
      .where(eq(productVariant.id, variantId))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Variant not found");
    const [prod] = await db
      .select()
      .from(product)
      .where(eq(product.id, existing.productId))
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      prod.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const siblings = await db
      .select()
      .from(productVariant)
      .where(eq(productVariant.productId, existing.productId));
    if (siblings.length <= 1) {
      return apiError(c, 400, "LAST_VARIANT", "Cannot delete the last variant");
    }
    await db.delete(productVariant).where(eq(productVariant.id, variantId));
    await syncProductStockFromVariants(db, existing.productId);
    return c.json({ ok: true });
  });

  return app;
}

export async function syncProductStockFromVariants(db: Db, productId: string) {
  const variants = await db
    .select()
    .from(productVariant)
    .where(
      and(eq(productVariant.productId, productId), eq(productVariant.status, "active")),
    );
  const stock = variants.reduce((s, v) => s + v.stock, 0);
  const priceCents = variants[0]?.priceCents;
  await db
    .update(product)
    .set({
      stock,
      ...(priceCents !== undefined ? { priceCents } : {}),
      updatedAt: new Date(),
    })
    .where(eq(product.id, productId));
}

export async function ensureDefaultVariant(
  db: Db,
  prod: {
    id: string;
    sku: string;
    priceCents: number;
    stock: number;
    status: "draft" | "active" | "archived";
  },
) {
  const [existing] = await db
    .select()
    .from(productVariant)
    .where(eq(productVariant.productId, prod.id))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(productVariant)
    .values({
      productId: prod.id,
      sku: prod.sku,
      optionsJson: {},
      priceCents: prod.priceCents,
      stock: prod.stock,
      status: prod.status === "archived" ? "archived" : "active",
    })
    .returning();
  return created!;
}
