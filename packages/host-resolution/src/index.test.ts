import { describe, expect, it } from "vitest";
import { resolveHostKind } from "./index.js";

describe("resolveHostKind", () => {
  it("parses platform subdomain", () => {
    const r = resolveHostKind({
      host: "acme.sites.mestryx.dev",
      sitesHostSuffix: "sites.mestryx.dev",
    });
    expect(r).toEqual({
      kind: "platform_subdomain",
      slug: "acme",
      hostname: "acme.sites.mestryx.dev",
    });
  });

  it("treats other hosts as custom", () => {
    const r = resolveHostKind({
      host: "www.example.com",
      sitesHostSuffix: "sites.mestryx.dev",
    });
    expect(r.kind).toBe("custom_hostname");
  });
});
