import { describe, expect, it } from "vitest";
import { slugify } from "./lib/api";

describe("slugify", () => {
  it("normalizes names", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
});
