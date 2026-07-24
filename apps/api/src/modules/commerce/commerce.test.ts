/**
 * Commerce isolation + cart/checkout/mark-paid — requires DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { product } from "../../db/schema.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("commerce storefront", () => {
  let db: Db;
  let client: ReturnType<typeof createDb>["client"];
  let cookieA = "";
  let cookieB = "";
  let siteAId = "";
  let orgAId = "";
  let productAId = "";
  let productCancelId = "";

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

    cookieA = await signUp(`com-a-${Date.now()}@example.com`);
    cookieB = await signUp(`com-b-${Date.now()}@example.com`);

    const orgARes = await app.request("/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({ name: "Shop A", slug: `shop-a-${Date.now()}` }),
    });
    expect(orgARes.status).toBe(201);
    const orgA = (await orgARes.json()) as { organization: { id: string } };
    orgAId = orgA.organization.id;

    await app.request("/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieB },
      body: JSON.stringify({ name: "Shop B", slug: `shop-b-${Date.now()}` }),
    });

    const siteRes = await app.request("/v1/sites", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({
        organizationId: orgA.organization.id,
        name: "Store",
        slug: `store-${Date.now()}`,
      }),
    });
    expect(siteRes.status).toBe(201);
    siteAId = ((await siteRes.json()) as { site: { id: string } }).site.id;

    async function createProduct(name: string, stock: number) {
      const stamp = `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
      const res = await app.request("/v1/products", {
        method: "POST",
        headers: { "content-type": "application/json", cookie: cookieA },
        body: JSON.stringify({
          organizationId: orgAId,
          siteId: siteAId,
          name,
          slug: `p-${stamp}`,
          sku: `SKU-${stamp}`,
          priceCents: 2500,
          stock,
          status: "active",
        }),
      });
      expect(res.status).toBe(201);
      return ((await res.json()) as { product: { id: string } }).product.id;
    }

    productAId = await createProduct("Tee", 10);
    productCancelId = await createProduct("Hoodie", 5);
  });

  afterAll(async () => {
    await client.end({ timeout: 5 });
  });

  it("blocks other tenant from listing org products", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const res = await app.request(`/v1/organizations/${orgAId}/products`, {
      headers: { cookie: cookieB },
    });
    expect(res.status).toBe(403);
  });

  it("checkout → mark-paid creates invoice; CSV export works", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const addRes = await app.request("/v1/public/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: siteAId,
        productId: productAId,
        quantity: 2,
      }),
    });
    expect(addRes.status).toBe(201);
    const setCookie = addRes.headers.getSetCookie?.() ?? [];
    const cartCookie =
      setCookie.map((c) => c.split(";")[0]).join("; ") ||
      addRes.headers.get("set-cookie")?.split(";")[0] ||
      "";

    const checkoutRes = await app.request("/v1/public/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cartCookie,
      },
      body: JSON.stringify({
        siteId: siteAId,
        email: "buyer@example.com",
        shippingAddress: {
          name: "Buyer",
          line1: "1 rue Test",
          city: "Paris",
          postalCode: "75001",
          country: "FR",
        },
      }),
    });
    expect(checkoutRes.status).toBe(201);
    const body = (await checkoutRes.json()) as {
      order: { id: string; status: string; totalCents: number; taxCents: number };
      payment: { provider: string };
    };
    expect(body.order.status).toBe("pending_payment");
    expect(body.order.totalCents).toBe(5000);
    expect(body.order.taxCents).toBeGreaterThan(0);
    expect(body.payment.provider).toBe("deferred");

    const paidRes = await app.request(`/v1/orders/${body.order.id}/mark-paid`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: "{}",
    });
    expect(paidRes.status).toBe(200);
    const paidBody = (await paidRes.json()) as {
      order: { status: string };
      invoice: { number: string };
    };
    expect(paidBody.order.status).toBe("paid");
    expect(paidBody.invoice.number).toMatch(/^INV-\d{4}-\d{4}$/);

    const pdfRes = await app.request(`/v1/orders/${body.order.id}/invoice.pdf`, {
      headers: { cookie: cookieA },
    });
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers.get("content-type")).toContain("application/pdf");

    const csvRes = await app.request(
      `/v1/organizations/${orgAId}/exports/accounting.csv`,
      { headers: { cookie: cookieA } },
    );
    expect(csvRes.status).toBe(200);
    const csv = await csvRes.text();
    expect(csv).toContain(paidBody.invoice.number);
    expect(csv).toContain("445710");
  });

  it("cancel pending order restores stock", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const [before] = await db
      .select()
      .from(product)
      .where(eq(product.id, productCancelId))
      .limit(1);
    expect(before!.stock).toBe(5);

    const addRes = await app.request("/v1/public/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: siteAId,
        productId: productCancelId,
        quantity: 3,
      }),
    });
    expect(addRes.status).toBe(201);
    const setCookie = addRes.headers.getSetCookie?.() ?? [];
    const cartCookie =
      setCookie.map((c) => c.split(";")[0]).join("; ") ||
      addRes.headers.get("set-cookie")?.split(";")[0] ||
      "";

    const checkoutRes = await app.request("/v1/public/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cartCookie,
      },
      body: JSON.stringify({
        siteId: siteAId,
        email: "cancel@example.com",
        shippingAddress: {
          name: "Cancel",
          line1: "1 rue Test",
          city: "Paris",
          postalCode: "75001",
          country: "FR",
        },
      }),
    });
    expect(checkoutRes.status).toBe(201);
    const order = (await checkoutRes.json()) as { order: { id: string } };

    const [mid] = await db
      .select()
      .from(product)
      .where(eq(product.id, productCancelId))
      .limit(1);
    expect(mid!.stock).toBe(2);

    const cancelRes = await app.request(`/v1/orders/${order.order.id}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: "{}",
    });
    expect(cancelRes.status).toBe(200);

    const [after] = await db
      .select()
      .from(product)
      .where(eq(product.id, productCancelId))
      .limit(1);
    expect(after!.stock).toBe(5);
  });

  it("categories filter PLP and variants drive cart price", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const catRes = await app.request("/v1/categories", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({
        organizationId: orgAId,
        siteId: siteAId,
        name: "Tees",
        slug: `tees-${Date.now()}`,
      }),
    });
    expect(catRes.status).toBe(201);
    const cat = (await catRes.json()) as { category: { id: string; slug: string } };

    await app.request(`/v1/products/${productAId}/categories`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({ categoryIds: [cat.category.id] }),
    });

    const filtered = await app.request(
      `/v1/public/sites/${siteAId}/products?category=${encodeURIComponent(cat.category.slug)}`,
    );
    expect(filtered.status).toBe(200);
    const filteredBody = (await filtered.json()) as {
      products: Array<{ id: string }>;
    };
    expect(filteredBody.products.some((p) => p.id === productAId)).toBe(true);

    const empty = await app.request(
      `/v1/public/sites/${siteAId}/products?category=does-not-exist`,
    );
    expect(((await empty.json()) as { products: unknown[] }).products).toEqual(
      [],
    );

    const variantRes = await app.request(`/v1/products/${productAId}/variants`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({
        sku: `SKU-XL-${Date.now()}`,
        optionsJson: { size: "XL" },
        priceCents: 3200,
        stock: 3,
        status: "active",
      }),
    });
    expect(variantRes.status).toBe(201);
    const variant = (await variantRes.json()) as {
      variant: { id: string; priceCents: number };
    };

    const [prodRow] = await db
      .select()
      .from(product)
      .where(eq(product.id, productAId))
      .limit(1);
    const pdpRes = await app.request(
      `/v1/public/sites/${siteAId}/products/${encodeURIComponent(prodRow!.slug)}`,
    );
    expect(pdpRes.status).toBe(200);
    const pdpBody = (await pdpRes.json()) as {
      variants: Array<{ id: string }>;
    };
    expect(pdpBody.variants.length).toBeGreaterThanOrEqual(2);

    const addRes = await app.request("/v1/public/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId: siteAId,
        productId: productAId,
        variantId: variant.variant.id,
        quantity: 1,
      }),
    });
    expect(addRes.status).toBe(201);
    const cartBody = (await addRes.json()) as {
      cart: { items: Array<{ variantId: string; unitPriceCents: number }> };
    };
    expect(cartBody.cart.items[0]?.variantId).toBe(variant.variant.id);
    expect(cartBody.cart.items[0]?.unitPriceCents).toBe(3200);
  });

  it("storefront customer: sign-up, checkout links customerId, lists orders", async () => {
    const config = loadConfig();
    const auth = createAuth(db, config);
    const app = createApp({ db, auth, config });

    const email = `buyer-${Date.now()}@example.com`;
    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: "Password123!",
        name: "Store Buyer",
      }),
    });
    expect(signUp.status).toBeLessThan(400);
    const buyerCookie =
      (signUp.headers.getSetCookie?.() ?? [])
        .map((c) => c.split(";")[0])
        .join("; ") ||
      signUp.headers.get("set-cookie")?.split(",")[0]?.split(";")[0] ||
      "";

    const meRes = await app.request(
      `/v1/storefront/me?siteId=${encodeURIComponent(siteAId)}`,
      { headers: { cookie: buyerCookie } },
    );
    expect(meRes.status).toBe(200);
    const me = (await meRes.json()) as {
      customer: { id: string; email: string };
    };
    expect(me.customer.email).toBe(email.toLowerCase());

    const addRes = await app.request("/v1/public/cart/items", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: buyerCookie,
      },
      body: JSON.stringify({
        siteId: siteAId,
        productId: productAId,
        quantity: 1,
      }),
    });
    expect(addRes.status).toBe(201);
    const cartCookie = [
      buyerCookie,
      ...(addRes.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]),
    ]
      .filter(Boolean)
      .join("; ");

    const checkoutRes = await app.request("/v1/public/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: cartCookie,
      },
      body: JSON.stringify({
        siteId: siteAId,
        email,
        shippingAddress: {
          name: "Store Buyer",
          line1: "2 rue Client",
          city: "Lyon",
          postalCode: "69001",
          country: "FR",
        },
      }),
    });
    expect(checkoutRes.status).toBe(201);
    const orderBody = (await checkoutRes.json()) as {
      order: { publicId: string };
    };

    const listRes = await app.request(
      `/v1/storefront/orders?siteId=${encodeURIComponent(siteAId)}`,
      { headers: { cookie: buyerCookie } },
    );
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as {
      orders: Array<{ publicId: string }>;
    };
    expect(list.orders.some((o) => o.publicId === orderBody.order.publicId)).toBe(
      true,
    );
  });
});
