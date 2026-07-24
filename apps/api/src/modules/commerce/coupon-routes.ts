import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import { coupon } from "../../db/schema.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";
import { normalizeCouponCode } from "./coupons.js";

const createSchema = z.object({
  organizationId: z.string().uuid(),
  code: z.string().min(1).max(64),
  type: z.enum(["percent", "fixed"]),
  /** percent: basis points (1000 = 10%); fixed: cents */
  value: z.number().int().positive(),
  minSubtotalCents: z.number().int().min(0).nullable().optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional().default(true),
});

const updateSchema = createSchema
  .partial()
  .omit({ organizationId: true });

export function couponRoutes(db: Db, auth: Auth) {
  const app = new Hono();

  app.get("/organizations/:orgId/coupons", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const rows = await db
      .select()
      .from(coupon)
      .where(eq(coupon.organizationId, orgId))
      .orderBy(asc(coupon.code));
    return c.json({ coupons: rows });
  });

  app.post("/coupons", async (c) => {
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

    if (parsed.data.type === "percent" && parsed.data.value > 10_000) {
      return apiError(c, 400, "VALIDATION_ERROR", "percent value max is 10000 bps");
    }

    const code = normalizeCouponCode(parsed.data.code);
    try {
      const [row] = await db
        .insert(coupon)
        .values({
          organizationId: parsed.data.organizationId,
          code,
          type: parsed.data.type,
          value: parsed.data.value,
          minSubtotalCents: parsed.data.minSubtotalCents ?? null,
          maxRedemptions: parsed.data.maxRedemptions ?? null,
          expiresAt: parsed.data.expiresAt
            ? new Date(parsed.data.expiresAt)
            : null,
          active: parsed.data.active ?? true,
        })
        .returning();
      return c.json({ coupon: row }, 201);
    } catch {
      return apiError(c, 409, "CONFLICT", "Coupon code already exists");
    }
  });

  app.patch("/coupons/:couponId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const [existing] = await db
      .select()
      .from(coupon)
      .where(eq(coupon.id, c.req.param("couponId")))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Coupon not found");
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
    if (data.type === "percent" && data.value != null && data.value > 10_000) {
      return apiError(c, 400, "VALIDATION_ERROR", "percent value max is 10000 bps");
    }

    const [row] = await db
      .update(coupon)
      .set({
        ...(data.code != null ? { code: normalizeCouponCode(data.code) } : {}),
        ...(data.type != null ? { type: data.type } : {}),
        ...(data.value != null ? { value: data.value } : {}),
        ...(data.minSubtotalCents !== undefined
          ? { minSubtotalCents: data.minSubtotalCents }
          : {}),
        ...(data.maxRedemptions !== undefined
          ? { maxRedemptions: data.maxRedemptions }
          : {}),
        ...(data.expiresAt !== undefined
          ? {
              expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            }
          : {}),
        ...(data.active != null ? { active: data.active } : {}),
        updatedAt: new Date(),
      })
      .where(eq(coupon.id, existing.id))
      .returning();
    return c.json({ coupon: row });
  });

  return app;
}
