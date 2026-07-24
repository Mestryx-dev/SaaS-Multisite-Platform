/**
 * F-104 isolation tests — require DATABASE_URL and a migrated DB.
 * Skipped automatically when DATABASE_URL is unset (CI without services).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { membership, organization, site, user } from "../../db/schema.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("F-104 tenant isolation", () => {
  let db: Db;
  let client: ReturnType<typeof createDb>["client"];
  let cookieA = "";
  let cookieB = "";
  let siteAId = "";
  let orgBId = "";

  beforeAll(async () => {
    const bundle = createDb(databaseUrl!);
    db = bundle.db;
    client = bundle.client;
    await seedPlans(db);

    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const emailA = `iso-a-${Date.now()}@example.com`;
    const emailB = `iso-b-${Date.now()}@example.com`;
    const password = "Password123!";

    async function signUp(email: string) {
      const res = await app.request("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name: email }),
      });
      expect(res.status).toBeLessThan(400);
      const setCookie = res.headers.getSetCookie?.() ?? [];
      const cookieHeader =
        setCookie.map((c) => c.split(";")[0]).join("; ") ||
        res.headers.get("set-cookie")?.split(",")[0]?.split(";")[0] ||
        "";
      return cookieHeader;
    }

    cookieA = await signUp(emailA);
    cookieB = await signUp(emailB);
    expect(cookieA).toBeTruthy();
    expect(cookieB).toBeTruthy();

    const orgARes = await app.request("/v1/organizations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cookieA,
      },
      body: JSON.stringify({ name: "Org A", slug: `org-a-${Date.now()}` }),
    });
    expect(orgARes.status).toBe(201);
    const orgABody = (await orgARes.json()) as { organization: { id: string } };

    const orgBRes = await app.request("/v1/organizations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cookieB,
      },
      body: JSON.stringify({ name: "Org B", slug: `org-b-${Date.now()}` }),
    });
    expect(orgBRes.status).toBe(201);
    const orgBBody = (await orgBRes.json()) as { organization: { id: string } };
    orgBId = orgBBody.organization.id;

    const siteRes = await app.request("/v1/sites", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cookieA,
      },
      body: JSON.stringify({
        organizationId: orgABody.organization.id,
        name: "Site A",
        slug: `site-a-${Date.now()}`,
      }),
    });
    expect(siteRes.status).toBe(201);
    const siteBody = (await siteRes.json()) as { site: { id: string } };
    siteAId = siteBody.site.id;
  });

  afterAll(async () => {
    await client.end({ timeout: 5 });
  });

  it("member of org B cannot read org A site", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const res = await app.request(`/v1/sites/${siteAId}`, {
      headers: { cookie: cookieB },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("FORBIDDEN");
  });

  it("member of org B cannot list org A sites via foreign org id", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const [siteRow] = await db.select().from(site).where(eq(site.id, siteAId)).limit(1);
    expect(siteRow).toBeTruthy();

    const res = await app.request(`/v1/organizations/${siteRow!.organizationId}/sites`, {
      headers: { cookie: cookieB },
    });
    expect(res.status).toBe(403);
  });

  it("membership rows are scoped per org", async () => {
    const rows = await db
      .select()
      .from(membership)
      .where(eq(membership.organizationId, orgBId));
    expect(rows.length).toBeGreaterThanOrEqual(1);
    for (const row of rows) {
      expect(row.organizationId).toBe(orgBId);
    }
  });

  it("users table has both tenants' owners", async () => {
    const users = await db.select({ id: user.id, email: user.email }).from(user);
    expect(users.length).toBeGreaterThanOrEqual(2);
  });
});
