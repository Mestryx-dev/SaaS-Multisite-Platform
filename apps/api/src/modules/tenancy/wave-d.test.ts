/**
 * Wave D platform ops: FB-084 modules, FB-085 theme, FB-089 Umami, FB-097 billing fields.
 * Requires DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";
import { organization, site } from "../../db/schema.js";
import { normalizeThemeJson } from "../../lib/theme.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describe("theme normalize (unit)", () => {
  it("maps legacy accent/background to v2 luna preset", () => {
    const t = normalizeThemeJson({
      mood: "girly",
      accent: "#c45d8a",
      background: "#f4f0e8",
    });
    expect(t?.version).toBe(2);
    expect(t?.preset).toBe("luna");
    expect(t?.tokens?.accent).toBe("#c45d8a");
    expect(t?.tokens?.primary).toBe("#c45d8a");
    expect(t?.tokens?.background).toBe("#f4f0e8");
  });

  it("resolves luna preset to Studio primary oklch", async () => {
    const { themeToCssVars } = await import("../../lib/theme.js");
    const css = themeToCssVars({
      version: 2,
      preset: "luna",
    });
    expect(css).toContain("--primary: oklch(0.43 0.04 41.99)");
    expect(css).toContain("--background: oklch(0.965 0.012 75)");
  });
});

describeDb("wave D platform ops", () => {
  let db: Db;
  let client: ReturnType<typeof createDb>["client"];
  let cookie = "";
  let orgId = "";
  let siteId = "";
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    const bundle = createDb(databaseUrl!);
    db = bundle.db;
    client = bundle.client;
    await seedPlans(db);

    const config = loadConfig();
    const auth = createAuth(db, config);
    app = createApp({ db, auth, config });

    const email = `wave-d-${Date.now()}@example.com`;
    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: "password12345",
        name: "Wave D",
      }),
    });
    expect(signUp.status).toBeLessThan(400);
    cookie = signUp.headers.getSetCookie?.()?.join("; ") ?? "";

    const orgRes = await app.request("/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        name: "Wave D Org",
        slug: `wave-d-${Date.now()}`,
      }),
    });
    const orgBody = (await orgRes.json()) as { organization: { id: string } };
    orgId = orgBody.organization.id;

    const siteRes = await app.request("/v1/sites", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        organizationId: orgId,
        name: "Wave D Shop",
        slug: `wave-d-shop-${Date.now()}`,
      }),
    });
    const siteBody = (await siteRes.json()) as { site: { id: string } };
    siteId = siteBody.site.id;
  });

  afterAll(async () => {
    await client.end();
  });

  it("rejects commerce module on free plan (FB-084)", async () => {
    const bad = await app.request(`/v1/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ modulesAllowed: ["cms", "commerce"] }),
    });
    expect(bad.status).toBe(403);

    await db
      .update(organization)
      .set({ planId: "pro", updatedAt: new Date() })
      .where(eq(organization.id, orgId));

    const ok = await app.request(`/v1/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ modulesAllowed: ["cms", "commerce"] }),
    });
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as {
      organization: { modulesAllowed: string[] };
    };
    expect(body.organization.modulesAllowed).toContain("commerce");
  });

  it("patches themeJson and umami fields (FB-085/089)", async () => {
    const patch = await app.request(`/v1/sites/${siteId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        themeJson: {
          version: 1,
          primaryColor: "#112233",
          accentColor: "#445566",
          backgroundColor: "#fafafa",
        },
        umamiWebsiteId: "test-website-id",
        umamiSrc: "https://stats.example.com/script.js",
      }),
    });
    expect(patch.status).toBe(200);
    const body = (await patch.json()) as {
      site: {
        themeJson: {
          version: number;
          preset?: string;
          tokens?: { primary?: string };
        };
        umamiWebsiteId: string;
        umamiSrc: string;
      };
    };
    expect(body.site.themeJson.version).toBe(2);
    expect(body.site.themeJson.tokens?.primary).toBe("#112233");
    expect(body.site.umamiWebsiteId).toBe("test-website-id");
    expect(body.site.umamiSrc).toContain("stats.example.com");

    const [row] = await db.select().from(site).where(eq(site.id, siteId)).limit(1);
    expect(row?.umamiWebsiteId).toBe("test-website-id");
  });

  it("billing returns entitlements matrix fields (FB-097)", async () => {
    const res = await app.request(`/v1/organizations/${orgId}/billing`, {
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      billing: {
        maxSites: number;
        sitesUsed: number;
        planModulesAllowed: string[];
        orgModulesAllowed: string[];
      };
    };
    expect(body.billing.sitesUsed).toBeGreaterThanOrEqual(1);
    expect(body.billing.planModulesAllowed).toContain("cms");
    expect(body.billing.orgModulesAllowed).toContain("commerce");
  });

  it("blocks product create without commerce module", async () => {
    await db
      .update(organization)
      .set({ modulesAllowed: ["cms"], updatedAt: new Date() })
      .where(eq(organization.id, orgId));

    const create = await app.request("/v1/products", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        organizationId: orgId,
        name: "Blocked",
        slug: `blocked-${Date.now()}`,
        sku: `BLK-${Date.now()}`,
        priceCents: 100,
      }),
    });
    expect(create.status).toBe(403);
  });
});
