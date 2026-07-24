import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import { coupon } from "../../db/schema.js";

export type CouponRow = typeof coupon.$inferSelect;

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Discount on merchandise subtotal (TTC), capped at subtotal. */
export function computeDiscountCents(
  row: Pick<CouponRow, "type" | "value">,
  subtotalCents: number,
): number {
  if (subtotalCents <= 0) return 0;
  let raw = 0;
  if (row.type === "percent") {
    raw = Math.floor((subtotalCents * row.value) / 10_000);
  } else {
    raw = row.value;
  }
  return Math.min(Math.max(0, raw), subtotalCents);
}

export async function findActiveCoupon(
  db: Db,
  organizationId: string,
  code: string,
): Promise<CouponRow | null> {
  const normalized = normalizeCouponCode(code);
  const [row] = await db
    .select()
    .from(coupon)
    .where(
      and(
        eq(coupon.organizationId, organizationId),
        eq(coupon.code, normalized),
      ),
    )
    .limit(1);
  return row ?? null;
}

export function validateCouponForCheckout(
  row: CouponRow,
  subtotalCents: number,
  now = new Date(),
): { ok: true; discountCents: number } | { ok: false; code: string; message: string } {
  if (!row.active) {
    return { ok: false, code: "COUPON_INACTIVE", message: "Coupon is inactive" };
  }
  if (row.expiresAt && row.expiresAt.getTime() < now.getTime()) {
    return { ok: false, code: "COUPON_EXPIRED", message: "Coupon has expired" };
  }
  if (
    row.maxRedemptions != null &&
    row.redemptionCount >= row.maxRedemptions
  ) {
    return {
      ok: false,
      code: "COUPON_EXHAUSTED",
      message: "Coupon redemption limit reached",
    };
  }
  if (
    row.minSubtotalCents != null &&
    subtotalCents < row.minSubtotalCents
  ) {
    return {
      ok: false,
      code: "COUPON_MIN_SUBTOTAL",
      message: "Order subtotal is below coupon minimum",
    };
  }
  const discountCents = computeDiscountCents(row, subtotalCents);
  if (discountCents <= 0) {
    return {
      ok: false,
      code: "COUPON_NO_EFFECT",
      message: "Coupon does not apply to this cart",
    };
  }
  return { ok: true, discountCents };
}

export async function incrementCouponRedemption(db: Db, couponId: string) {
  await db
    .update(coupon)
    .set({
      redemptionCount: sql`${coupon.redemptionCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(coupon.id, couponId));
}
