import { describe, expect, it } from "vitest";
import { taxFromInclusive, vatRateForClass } from "./tax.js";

describe("commerce tax", () => {
  it("uses FR standard VAT 20%", () => {
    expect(vatRateForClass("standard")).toBe(0.2);
    expect(taxFromInclusive(1200, "standard")).toBe(200);
  });

  it("handles zero rate", () => {
    expect(taxFromInclusive(1000, "zero")).toBe(0);
  });
});
