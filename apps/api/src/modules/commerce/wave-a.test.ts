/**
 * FB-073 banners + FB-074 search — requires DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";
import { ensureLegalPages } from "../cms/legal-pages.js";
import { eq } from "drizzle-orm";
import { page, product } from "../../db/schema.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("wave A merch + trust", () => {
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

    const email = `wave-a-${Date.now()}@example.com`;
    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: "password12345",
        name: "Wave A",
      }),
    });
    expect(signUp.status).toBeLessThan(400);
    cookie = signUp.headers.getSetCookie?.()?.join("; ") ?? "";

    const orgRes = await app.request("/v1/organizations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        name: "Wave A Org",
        slug: `wave-a-${Date.now()}`,
      }),
    });
    const orgBody = (await orgRes.json()) as { organization: { id: string } };
    orgId = orgBody.organization.id;

    const siteRes = await app.request("/v1/sites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        organizationId: orgId,
        name: "Wave Shop",
        slug: `wave-shop-${Date.now()}`,
      }),
    });
    const siteBody = (await siteRes.json()) as { site: { id: string } };
    siteId = siteBody.site.id;

    await db.insert(product).values({
      organizationId: orgId,
      siteId,
      sku: "WAVE-1",
      name: "Silver Ring Unique",
      slug: "silver-ring-unique",
      description: "Handmade silver",
      priceCents: 4500,
      stock: 5,
      status: "active",
    });
  });

  afterAll(async () => {
    await client.end();
  });

  it("creates banners and lists public active ones", async () => {
    const create = await app.request("/v1/banners", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        organizationId: orgId,
        siteId,
        title: "Summer Sale",
        subtitle: "10% off",
        href: "/",
        sortOrder: 1,
        active: true,
      }),
    });
    expect(create.status).toBe(201);

    const pub = await app.request(`/v1/public/sites/${siteId}/banners`);
    expect(pub.status).toBe(200);
    const body = (await pub.json()) as { banners: Array<{ title: string }> };
    expect(body.banners.some((b) => b.title === "Summer Sale")).toBe(true);
  });

  it("filters public products by q", async () => {
    const hit = await app.request(
      `/v1/public/sites/${siteId}/products?q=${encodeURIComponent("Silver")}`,
    );
    expect(hit.status).toBe(200);
    const hitBody = (await hit.json()) as { products: unknown[] };
    expect(hitBody.products.length).toBeGreaterThanOrEqual(1);

    const miss = await app.request(
      `/v1/public/sites/${siteId}/products?q=${encodeURIComponent("zzzz-nope")}`,
    );
    const missBody = (await miss.json()) as { products: unknown[] };
    expect(missBody.products.length).toBe(0);
  });

  it("seeds legal pages and patches cookie consent", async () => {
    await ensureLegalPages(db, siteId);
    const pages = await db.select().from(page).where(eq(page.siteId, siteId));
    const slugs = pages.map((p) => p.slug);
    expect(slugs).toContain("privacy");
    expect(slugs).toContain("terms");
    expect(slugs).toContain("legal");

    const patch = await app.request(`/v1/sites/${siteId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ cookieConsentEnabled: false }),
    });
    expect(patch.status).toBe(200);
    const patched = (await patch.json()) as {
      site: { cookieConsentEnabled: boolean };
    };
    expect(patched.site.cookieConsentEnabled).toBe(false);
  });

  it("sets security headers on health", async () => {
    const res = await app.request("/health");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toBeTruthy();
  });
});
