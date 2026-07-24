import { describe, expect, it } from "vitest";
import { countryMatchesZone } from "./shipping-routes.js";

describe("countryMatchesZone", () => {
  it("matches ISO country and wildcard", () => {
    expect(countryMatchesZone(["FR", "BE"], "fr")).toBe(true);
    expect(countryMatchesZone(["FR"], "CH")).toBe(false);
    expect(countryMatchesZone(["*"], "US")).toBe(true);
  });
});
