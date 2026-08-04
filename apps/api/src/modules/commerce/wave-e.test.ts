/**
 * Wave E: FB-087 preview, FB-081 abandoned carts, FB-082 RMA.
 * Requires DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";
import {
  cart,
  cartItem,
  customer,
  organization,
  product,
  productVariant,
  storeOrder,
} from "../../db/schema.js";
import {
  signPreviewToken,
  verifyPreviewToken,
} from "../../lib/preview-token.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describe("preview token (unit)", () => {
  it("signs and verifies", () => {
    const secret = "test-secret-at-least-32-characters!!";
    const token = signPreviewToken(secret, {
      pageId: "11111111-1111-1111-1111-111111111111",
      siteId: "22222222-2222-2222-2222-222222222222",
      slug: "hello",
    });
    const payload = verifyPreviewToken(secret, token);
    expect(payload?.slug).toBe("hello");
    expect(verifyPreviewToken(secret, "bad.token")).toBeNull();
  });
});

describeDb("wave E preview + commerce", () => {
  let db: Db;
  let client: ReturnType<typeof createDb>["client"];
  let cookie = "";
  let orgId = "";
  let siteId = "";
  let pageId = "";
  let pageSlug = "";
  let app: ReturnType<typeof createApp>;
  let config: ReturnType<typeof loadConfig>;

  beforeAll(async () => {
    const bundle = createDb(databaseUrl!);
    db = bundle.db;
    client = bundle.client;
    await seedPlans(db);

    config = loadConfig();
    const auth = createAuth(db, config);
    app = createApp({ db, auth, config });

    const email = `wave-e-${Date.now()}@example.com`;
    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: "password12345",
        name: "Wave E",
      }),
    });
    expect(signUp.status).toBeLessThan(400);
    cookie = signUp.headers.getSetCookie?.()?.join("; ") ?? "";

    const orgRes = await app.request("/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        name: "Wave E Org",
        slug: `wave-e-${Date.now()}`,
      }),
    });
    orgId = ((await orgRes.json()) as { organization: { id: string } })
      .organization.id;

    await db
      .update(organization)
      .set({
        planId: "pro",
        modulesAllowed: ["cms", "commerce"],
        updatedAt: new Date(),
      })
      .where(eq(organization.id, orgId));

    const siteRes = await app.request("/v1/sites", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        organizationId: orgId,
        name: "Wave E Shop",
        slug: `wave-e-shop-${Date.now()}`,
      }),
    });
    siteId = ((await siteRes.json()) as { site: { id: string } }).site.id;

    pageSlug = `draft-preview-${Date.now()}`;
    const pageRes = await app.request("/v1/pages", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        siteId,
        slug: pageSlug,
        title: "Draft Preview",
        status: "draft",
        bodyJson: { version: 1, blocks: [] },
      }),
    });
    expect(pageRes.status).toBe(201);
    pageId = ((await pageRes.json()) as { page: { id: string } }).page.id;

    await app.request(
      `/v1/storefront/me?siteId=${encodeURIComponent(siteId)}`,
      { headers: { cookie } },
    );
  });

  afterAll(async () => {
    await client.end();
  });

  it("previews draft page with valid token (FB-087)", async () => {
    const pub = await app.request(
      `/v1/public/sites/${siteId}/pages/${pageSlug}`,
    );
    expect(pub.status).toBe(404);

    const mint = await app.request(`/v1/pages/${pageId}/preview-token`, {
      method: "POST",
      headers: { cookie },
    });
    expect(mint.status).toBe(200);
    const { token } = (await mint.json()) as { token: string };

    const preview = await app.request(
      `/v1/public/sites/${siteId}/pages/${pageSlug}?preview=${encodeURIComponent(token)}`,
    );
    expect(preview.status).toBe(200);
    const body = (await preview.json()) as {
      page: { slug: string; status: string };
      preview: boolean;
    };
    expect(body.page.slug).toBe(pageSlug);
    expect(body.page.status).toBe("draft");
    expect(body.preview).toBe(true);

    const bad = await app.request(
      `/v1/public/sites/${siteId}/pages/${pageSlug}?preview=invalid`,
    );
    expect(bad.status).toBe(404);
  });

  it("runs abandoned cart emails (FB-081)", async () => {
    const [cust] = await db
      .select()
      .from(customer)
      .where(eq(customer.siteId, siteId))
      .limit(1);
    expect(cust).toBeTruthy();

    const [prod] = await db
      .insert(product)
      .values({
        organizationId: orgId,
        siteId,
        sku: `WE-${Date.now()}`,
        name: "Abandon Item",
        slug: `abandon-${Date.now()}`,
        priceCents: 2000,
        stock: 5,
        status: "active",
      })
      .returning();

    const [variant] = await db
      .insert(productVariant)
      .values({
        productId: prod!.id,
        sku: `${prod!.sku}-DEF`,
        priceCents: 2000,
        stock: 5,
        status: "active",
        optionsJson: {},
      })
      .returning();

    const stale = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const [cartRow] = await db
      .insert(cart)
      .values({
        siteId,
        sessionToken: `abandon-${Date.now()}`,
        customerId: cust!.id,
        updatedAt: stale,
      })
      .returning();

    await db.insert(cartItem).values({
      cartId: cartRow!.id,
      productId: prod!.id,
      variantId: variant!.id,
      quantity: 1,
      unitPriceCents: 2000,
    });

    const list = await app.request(
      `/v1/organizations/${orgId}/abandoned-carts`,
      { headers: { cookie } },
    );
    expect(list.status).toBe(200);
    const listBody = (await list.json()) as { carts: unknown[] };
    expect(listBody.carts.length).toBeGreaterThanOrEqual(1);

    const run = await app.request(
      `/v1/organizations/${orgId}/abandoned-carts/run`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ olderThanHours: 24 }),
      },
    );
    expect(run.status).toBe(200);
    const runBody = (await run.json()) as { sent: number };
    expect(runBody.sent).toBeGreaterThanOrEqual(1);

    const [updated] = await db
      .select()
      .from(cart)
      .where(eq(cart.id, cartRow!.id))
      .limit(1);
    expect(updated?.abandonedEmailSentAt).toBeTruthy();
  });

  it("creates and approves RMA (FB-082)", async () => {
    const [cust] = await db
      .select()
      .from(customer)
      .where(eq(customer.siteId, siteId))
      .limit(1);

    const publicId = `ord_wavee_${Date.now()}`;
    const [order] = await db
      .insert(storeOrder)
      .values({
        publicId,
        organizationId: orgId,
        siteId,
        customerId: cust!.id,
        email: cust!.email,
        status: "paid",
        currency: "eur",
        subtotalCents: 2000,
        totalCents: 2000,
        shippingAddressJson: {},
        billingAddressJson: {},
      })
      .returning();

    const create = await app.request(
      `/v1/storefront/orders/${publicId}/returns`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          siteId,
          reason: "Wrong size",
        }),
      },
    );
    expect(create.status).toBe(201);
    const created = (await create.json()) as {
      returnRequest: { id: string; status: string };
    };
    expect(created.returnRequest.status).toBe("requested");

    const approve = await app.request(
      `/v1/returns/${created.returnRequest.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ status: "approved" }),
      },
    );
    expect(approve.status).toBe(200);
    const approved = (await approve.json()) as {
      returnRequest: { status: string };
    };
    expect(approved.returnRequest.status).toBe("approved");
    expect(order!.id).toBeTruthy();
  });
});
