import { describe, expect, it } from "vitest";
import { createWebApp } from "./server.js";
import { buildJsonLd } from "./seo.js";

describe("web SEO surfaces", () => {
  it("builds JSON-LD for site", () => {
    const ld = buildJsonLd({ id: "1", name: "Acme", slug: "acme" });
    expect(ld["@type"]).toBe("WebSite");
  });

  it("serves robots and llms.txt with HTML home", async () => {
    const app = createWebApp();
    const robots = await app.request("http://localhost/robots.txt", {
      headers: { host: "acme.sites.mestryx.dev" },
    });
    expect(robots.status).toBe(200);
    expect(await robots.text()).toContain("Sitemap:");

    const llms = await app.request("http://localhost/llms.txt", {
      headers: { host: "acme.sites.mestryx.dev" },
    });
    expect(llms.status).toBe(200);
    expect(await llms.text()).toMatch(/Shop:/);

    const home = await app.request("http://localhost/", {
      headers: { host: "acme.sites.mestryx.dev" },
    });
    expect(home.status).toBe(200);
    const html = await home.text();
    expect(html).toContain("<title>");
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('application/ld+json');
    expect(html).toMatch(/<h1[\s>]/);
  });
});
