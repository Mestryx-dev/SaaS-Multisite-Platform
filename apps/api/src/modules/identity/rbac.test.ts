import { describe, expect, it } from "vitest";
import { roleAtLeast } from "./rbac.js";

describe("rbac roleAtLeast", () => {
  it("owner covers all", () => {
    expect(roleAtLeast("owner", "viewer")).toBe(true);
    expect(roleAtLeast("owner", "admin")).toBe(true);
  });

  it("viewer cannot admin", () => {
    expect(roleAtLeast("viewer", "admin")).toBe(false);
  });

  it("editor can viewer", () => {
    expect(roleAtLeast("editor", "viewer")).toBe(true);
  });
});
