/**
 * Wave B — menus + media list + blocks normalize — requires DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";
import { normalizeBlocks } from "./blocks.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describe("cms blocks normalize", () => {
  it("maps legacy markdown to richtext block", () => {
    const blocks = normalizeBlocks({ markdown: "Hello" });
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe("richtext");
    expect(blocks[0]?.text).toBe("Hello");
  });

  it("keeps v1 blocks", () => {
    const blocks = normalizeBlocks({
      version: 1,
      blocks: [{ id: "1", type: "hero", title: "Hi" }],
    });
    expect(blocks[0]?.type).toBe("hero");
  });
});

describeDb("wave B menus + media", () => {
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

    const email = `wave-b-${Date.now()}@example.com`;
    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: "password12345",
        name: "Wave B",
      }),
    });
    expect(signUp.status).toBeLessThan(400);
    cookie = signUp.headers.getSetCookie?.()?.join("; ") ?? "";

    const orgRes = await app.request("/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        name: "Wave B Org",
        slug: `wave-b-${Date.now()}`,
      }),
    });
    orgId = ((await orgRes.json()) as { organization: { id: string } })
      .organization.id;

    const siteRes = await app.request("/v1/sites", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        organizationId: orgId,
        name: "Wave B Shop",
        slug: `wave-b-shop-${Date.now()}`,
      }),
    });
    siteId = ((await siteRes.json()) as { site: { id: string } }).site.id;
  });

  afterAll(async () => {
    await client.end();
  });

  it("CRUD menu items and public menus", async () => {
    const create = await app.request(
      `/v1/sites/${siteId}/menus/header/items`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ label: "About", href: "/about" }),
      },
    );
    expect(create.status).toBe(201);

    const pub = await app.request(`/v1/public/sites/${siteId}/menus`);
    expect(pub.status).toBe(200);
    const body = (await pub.json()) as {
      menus: { header: Array<{ label: string }> };
    };
    expect(body.menus.header.some((i) => i.label === "About")).toBe(true);
  });

  it("registers media and lists library", async () => {
    const reg = await app.request("/v1/media", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        organizationId: orgId,
        siteId,
        url: "https://example.com/img.jpg",
      }),
    });
    expect(reg.status).toBe(201);

    const list = await app.request(
      `/v1/organizations/${orgId}/media?siteId=${siteId}`,
      { headers: { cookie } },
    );
    expect(list.status).toBe(200);
    const body = (await list.json()) as { assets: unknown[] };
    expect(body.assets.length).toBeGreaterThanOrEqual(1);
  });

  it("saves page with blocks bodyJson", async () => {
    const res = await app.request("/v1/pages", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        siteId,
        title: "Blocks page",
        slug: `blocks-${Date.now()}`,
        status: "published",
        bodyJson: {
          version: 1,
          blocks: [
            { id: "h1", type: "hero", title: "Hello", text: "World" },
          ],
        },
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      page: { bodyJson: { version: number; blocks: unknown[] } };
    };
    expect(body.page.bodyJson.version).toBe(1);
    expect(body.page.bodyJson.blocks).toHaveLength(1);
  });
});
