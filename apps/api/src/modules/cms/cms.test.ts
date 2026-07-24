/**
 * CMS pages CRUD — requires DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("cms pages", () => {
  let db: Db;
  let client: ReturnType<typeof createDb>["client"];
  let cookieA = "";
  let cookieB = "";
  let siteAId = "";
  let pageId = "";

  beforeAll(async () => {
    const bundle = createDb(databaseUrl!);
    db = bundle.db;
    client = bundle.client;
    await seedPlans(db);

    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    async function signUp(email: string) {
      const res = await app.request("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password: "Password123!",
          name: email,
        }),
      });
      expect(res.status).toBeLessThan(400);
      const setCookie = res.headers.getSetCookie?.() ?? [];
      return (
        setCookie.map((c) => c.split(";")[0]).join("; ") ||
        res.headers.get("set-cookie")?.split(",")[0]?.split(";")[0] ||
        ""
      );
    }

    cookieA = await signUp(`cms-a-${Date.now()}@example.com`);
    cookieB = await signUp(`cms-b-${Date.now()}@example.com`);

    const orgARes = await app.request("/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({ name: "CMS A", slug: `cms-a-${Date.now()}` }),
    });
    expect(orgARes.status).toBe(201);
    const orgA = (await orgARes.json()) as { organization: { id: string } };

    await app.request("/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieB },
      body: JSON.stringify({ name: "CMS B", slug: `cms-b-${Date.now()}` }),
    });

    const siteRes = await app.request("/v1/sites", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({
        organizationId: orgA.organization.id,
        name: "Site",
        slug: `cms-site-${Date.now()}`,
      }),
    });
    expect(siteRes.status).toBe(201);
    siteAId = ((await siteRes.json()) as { site: { id: string } }).site.id;
  });

  afterAll(async () => {
    await client.end();
  });

  it("creates, patches, lists, and deletes a page; isolates tenants", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const createRes = await app.request("/v1/pages", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({
        siteId: siteAId,
        slug: "about",
        title: "About",
        bodyJson: { markdown: "Hello" },
        status: "draft",
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { page: { id: string; title: string } };
    pageId = created.page.id;
    expect(created.page.title).toBe("About");

    const patchRes = await app.request(`/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({
        title: "About us",
        status: "published",
        bodyJson: { markdown: "Updated" },
      }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as {
      page: { title: string; status: string };
    };
    expect(patched.page.title).toBe("About us");
    expect(patched.page.status).toBe("published");

    const listRes = await app.request(`/v1/sites/${siteAId}/pages`, {
      headers: { cookie: cookieA },
    });
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as { pages: { id: string }[] };
    expect(list.pages.some((p) => p.id === pageId)).toBe(true);

    const publicRes = await app.request(
      `/v1/public/sites/${siteAId}/pages/about`,
    );
    expect(publicRes.status).toBe(200);

    const denyRes = await app.request(`/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", cookie: cookieB },
      body: JSON.stringify({ title: "Hacked" }),
    });
    expect(denyRes.status).toBe(403);

    const delRes = await app.request(`/v1/pages/${pageId}`, {
      method: "DELETE",
      headers: { cookie: cookieA },
    });
    expect(delRes.status).toBe(200);

    const gone = await app.request(`/v1/pages/${pageId}`, {
      headers: { cookie: cookieA },
    });
    expect(gone.status).toBe(404);
  });
});
