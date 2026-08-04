/**
 * FB-051 billing checkout / portal / webhooks — require DATABASE_URL.
 * Skipped when DATABASE_URL is unset.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { organization, webhookEvent } from "../../db/schema.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "./routes.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("FB-051 billing checkout and portal", () => {
  let db: Db;
  let client: ReturnType<typeof createDb>["client"];
  let cookie = "";
  let orgId = "";
  const password = "Password123!";
  const stamp = Date.now();
  const email = `billing-${stamp}@example.com`;

  async function signUp(app: ReturnType<typeof createApp>, userEmail: string) {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: userEmail, password, name: userEmail }),
    });
    expect(res.status).toBeLessThan(400);
    const setCookie = res.headers.getSetCookie?.() ?? [];
    return (
      setCookie.map((c) => c.split(";")[0]).join("; ") ||
      res.headers.get("set-cookie")?.split(",")[0]?.split(";")[0] ||
      ""
    );
  }

  beforeAll(async () => {
    const bundle = createDb(databaseUrl!);
    db = bundle.db;
    client = bundle.client;
    await seedPlans(db);

    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    cookie = await signUp(app, email);
    expect(cookie).toBeTruthy();

    const orgRes = await app.request("/v1/organizations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        name: `Billing Org ${stamp}`,
        slug: `billing-org-${stamp}`,
      }),
    });
    expect(orgRes.status).toBe(201);
    const body = (await orgRes.json()) as { organization: { id: string } };
    orgId = body.organization.id;
  });

  afterAll(async () => {
    await client.end({ timeout: 5 });
  });

  it("returns billing summary and stub checkout without Stripe key", async () => {
    const config = loadConfig();
    // Force stub path regardless of env
    const stubConfig = { ...config, stripeSecretKey: undefined, stripeWebhookSecret: undefined };
    const auth = createAuth(db, stubConfig);
    const app = createApp({ db, auth, config: stubConfig });

    const billingRes = await app.request(`/v1/organizations/${orgId}/billing`, {
      headers: { cookie },
    });
    expect(billingRes.status).toBe(200);
    const billingBody = (await billingRes.json()) as {
      billing: { planId: string; stripeConfigured: boolean; canManage: boolean };
    };
    expect(billingBody.billing.planId).toBe("free");
    expect(billingBody.billing.stripeConfigured).toBe(false);
    expect(billingBody.billing.canManage).toBe(true);

    const checkoutRes = await app.request("/v1/billing/checkout-session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ organizationId: orgId, planId: "pro" }),
    });
    expect(checkoutRes.status).toBe(200);
    const checkout = (await checkoutRes.json()) as {
      mode: string;
      url?: string;
    };
    expect(checkout.mode).toBe("test_stub");
    expect(checkout.url).toContain("/billing?");

    const portalRes = await app.request("/v1/billing/portal-session", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ organizationId: orgId }),
    });
    expect(portalRes.status).toBe(200);
    const portal = (await portalRes.json()) as { mode: string };
    expect(portal.mode).toBe("test_stub");
  });

  it("processes unsigned webhook and updates plan idempotently", async () => {
    const config = loadConfig();
    const stubConfig = { ...config, stripeSecretKey: undefined, stripeWebhookSecret: undefined };
    const auth = createAuth(db, stubConfig);
    const app = createApp({ db, auth, config: stubConfig });

    const eventId = `evt_billing_${stamp}`;
    const payload = {
      id: eventId,
      type: "customer.subscription.created",
      data: {
        object: {
          status: "active",
          metadata: { organizationId: orgId, planId: "pro" },
          customer: "cus_test",
        },
      },
    };

    const res1 = await app.request("/v1/billing/webhooks/stripe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(res1.status).toBe(200);

    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);
    expect(org?.planId).toBe("pro");

    const res2 = await app.request("/v1/billing/webhooks/stripe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(res2.status).toBe(200);
    const dup = (await res2.json()) as { duplicate?: boolean };
    expect(dup.duplicate).toBe(true);

    const events = await db
      .select()
      .from(webhookEvent)
      .where(eq(webhookEvent.id, eventId));
    expect(events).toHaveLength(1);

    const deletePayload = {
      id: `evt_billing_del_${stamp}`,
      type: "customer.subscription.deleted",
      data: {
        object: {
          metadata: { organizationId: orgId },
          customer: "cus_test",
        },
      },
    };
    const res3 = await app.request("/v1/billing/webhooks/stripe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(deletePayload),
    });
    expect(res3.status).toBe(200);
    const [orgAfter] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, orgId))
      .limit(1);
    expect(orgAfter?.planId).toBe("free");
  });
});
