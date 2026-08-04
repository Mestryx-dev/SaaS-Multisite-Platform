import { describe, expect, it } from "vitest";
import { rowsToCsv } from "./csv-export";

describe("rowsToCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = rowsToCsv(
      ["id", "email"],
      [
        ["1", "a@b.com"],
        ["2", 'say "hi", please'],
      ],
    );
    expect(csv).toContain("id,email");
    expect(csv).toContain('"say ""hi"", please"');
  });
});
