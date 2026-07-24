import { describe, expect, it } from "vitest";
import {
  computeDiscountCents,
  normalizeCouponCode,
  validateCouponForCheckout,
} from "./coupons.js";

describe("coupons (FB-065)", () => {
  it("normalizes codes to uppercase", () => {
    expect(normalizeCouponCode("  welcome10 ")).toBe("WELCOME10");
  });

  it("computes percent and fixed discounts capped at subtotal", () => {
    expect(
      computeDiscountCents({ type: "percent", value: 1000 }, 10_000),
    ).toBe(1000);
    expect(
      computeDiscountCents({ type: "fixed", value: 500 }, 10_000),
    ).toBe(500);
    expect(
      computeDiscountCents({ type: "fixed", value: 50_000 }, 10_000),
    ).toBe(10_000);
  });

  it("rejects inactive / expired / min subtotal coupons", () => {
    const base = {
      id: "c1",
      organizationId: "o1",
      code: "SAVE",
      type: "percent" as const,
      value: 1000,
      minSubtotalCents: 5000,
      maxRedemptions: 10,
      redemptionCount: 0,
      expiresAt: null as Date | null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(validateCouponForCheckout({ ...base, active: false }, 8000).ok).toBe(
      false,
    );
    expect(
      validateCouponForCheckout(
        { ...base, expiresAt: new Date("2000-01-01") },
        8000,
      ).ok,
    ).toBe(false);
    expect(validateCouponForCheckout(base, 1000).ok).toBe(false);
    const ok = validateCouponForCheckout(base, 8000);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.discountCents).toBe(800);
  });
});
