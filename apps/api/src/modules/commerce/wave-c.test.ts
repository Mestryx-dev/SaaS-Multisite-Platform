/**
 * Wave C shop UX: FB-078 addresses, FB-080 tracking lookup, FB-083 PLP filters, FB-079 wishlist.
 * Requires DATABASE_URL.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../../app.js";
import { createDb, type Db } from "../../db/client.js";
import { loadConfig } from "../../lib/config.js";
import { createAuth } from "../identity/auth.js";
import { seedPlans } from "../billing/routes.js";
import { product, storeOrder } from "../../db/schema.js";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("wave C shop UX", () => {
  let db: Db;
  let client: ReturnType<typeof createDb>["client"];
  let cookie = "";
  let orgId = "";
  let siteId = "";
  let productCheapId = "";
  let productDearId = "";
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    const bundle = createDb(databaseUrl!);
    db = bundle.db;
    client = bundle.client;
    await seedPlans(db);

    const config = loadConfig();
    const auth = createAuth(db, config);
    app = createApp({ db, auth, config });

    const email = `wave-c-${Date.now()}@example.com`;
    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password: "password12345",
        name: "Wave C",
      }),
    });
    expect(signUp.status).toBeLessThan(400);
    cookie = signUp.headers.getSetCookie?.()?.join("; ") ?? "";

    const orgRes = await app.request("/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        name: "Wave C Org",
        slug: `wave-c-${Date.now()}`,
      }),
    });
    const orgBody = (await orgRes.json()) as { organization: { id: string } };
    orgId = orgBody.organization.id;

    const siteRes = await app.request("/v1/sites", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        organizationId: orgId,
        name: "Wave C Shop",
        slug: `wave-c-shop-${Date.now()}`,
      }),
    });
    const siteBody = (await siteRes.json()) as { site: { id: string } };
    siteId = siteBody.site.id;

    // Link storefront customer session
    await app.request(`/v1/storefront/me?siteId=${encodeURIComponent(siteId)}`, {
      headers: { cookie },
    });

    const [cheap] = await db
      .insert(product)
      .values({
        organizationId: orgId,
        siteId,
        sku: `WC-CHEAP-${Date.now()}`,
        name: "Wave C Cheap",
        slug: `wave-c-cheap-${Date.now()}`,
        description: "budget",
        priceCents: 1000,
        stock: 10,
        status: "active",
      })
      .returning();
    productCheapId = cheap!.id;

    const [dear] = await db
      .insert(product)
      .values({
        organizationId: orgId,
        siteId,
        sku: `WC-DEAR-${Date.now()}`,
        name: "Wave C Dear",
        slug: `wave-c-dear-${Date.now()}`,
        description: "premium",
        priceCents: 9000,
        stock: 5,
        status: "active",
      })
      .returning();
    productDearId = dear!.id;
  });

  afterAll(async () => {
    await client.end();
  });

  it("creates and lists customer addresses (FB-078)", async () => {
    const create = await app.request("/v1/storefront/addresses", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        siteId,
        label: "Home",
        name: "Ada Lovelace",
        line1: "1 Rue de la Paix",
        city: "Paris",
        postalCode: "75002",
        country: "FR",
        isDefault: true,
      }),
    });
    expect(create.status).toBe(201);
    const created = (await create.json()) as { address: { id: string } };

    const list = await app.request(
      `/v1/storefront/addresses?siteId=${encodeURIComponent(siteId)}`,
      { headers: { cookie } },
    );
    expect(list.status).toBe(200);
    const body = (await list.json()) as {
      addresses: Array<{ id: string; isDefault: boolean }>;
    };
    expect(body.addresses.some((a) => a.id === created.address.id)).toBe(true);
    expect(body.addresses.find((a) => a.id === created.address.id)?.isDefault).toBe(
      true,
    );
  });

  it("filters and sorts public products (FB-083)", async () => {
    const mid = await app.request(
      `/v1/public/sites/${siteId}/products?minPrice=2000&maxPrice=10000`,
    );
    expect(mid.status).toBe(200);
    const midBody = (await mid.json()) as {
      products: Array<{ id: string; priceCents: number }>;
    };
    expect(midBody.products.every((p) => p.priceCents >= 2000)).toBe(true);
    expect(midBody.products.some((p) => p.id === productDearId)).toBe(true);
    expect(midBody.products.some((p) => p.id === productCheapId)).toBe(false);

    const asc = await app.request(
      `/v1/public/sites/${siteId}/products?sort=price_asc`,
    );
    const ascBody = (await asc.json()) as {
      products: Array<{ id: string; priceCents: number }>;
    };
    const ours = ascBody.products.filter(
      (p) => p.id === productCheapId || p.id === productDearId,
    );
    expect(ours.length).toBe(2);
    expect(ours[0]!.priceCents).toBeLessThanOrEqual(ours[1]!.priceCents);
  });

  it("wishlist add, delete, and cart move path (FB-079)", async () => {
    const add = await app.request("/v1/public/wishlist/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteId, productId: productCheapId }),
    });
    expect(add.status).toBe(201);
    const wishCookie = add.headers.getSetCookie?.()?.join("; ") ?? "";

    const list = await app.request(
      `/v1/public/wishlist?siteId=${encodeURIComponent(siteId)}`,
      { headers: { cookie: wishCookie } },
    );
    const listBody = (await list.json()) as {
      items: Array<{ productId: string }>;
    };
    expect(listBody.items.some((i) => i.productId === productCheapId)).toBe(true);

    const toCart = await app.request("/v1/public/cart/items", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: wishCookie,
      },
      body: JSON.stringify({
        siteId,
        productId: productCheapId,
        quantity: 1,
      }),
    });
    expect(toCart.status).toBeLessThan(400);

    const del = await app.request(
      `/v1/public/wishlist/items/${productCheapId}?siteId=${encodeURIComponent(siteId)}`,
      { method: "DELETE", headers: { cookie: wishCookie } },
    );
    expect(del.status).toBe(200);

    const after = await app.request(
      `/v1/public/wishlist?siteId=${encodeURIComponent(siteId)}`,
      { headers: { cookie: wishCookie } },
    );
    const afterBody = (await after.json()) as {
      items: Array<{ productId: string }>;
    };
    expect(afterBody.items.some((i) => i.productId === productCheapId)).toBe(
      false,
    );
  });

  it("looks up order tracking by email + publicId (FB-080)", async () => {
    const orderEmail = `track-${Date.now()}@example.com`;
    const add = await app.request("/v1/public/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        siteId,
        productId: productDearId,
        quantity: 1,
      }),
    });
    const cartCookie = [
      cookie,
      ...(add.headers.getSetCookie?.() ?? []),
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
        siteId,
        email: orderEmail,
        shippingAddress: {
          name: "Guest Track",
          line1: "2 Avenue",
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

    await db
      .update(storeOrder)
      .set({
        carrier: "Colissimo",
        trackingNumber: "TRACK-WAVE-C-1",
      })
      .where(eq(storeOrder.publicId, orderBody.order.publicId));

    const hit = await app.request("/v1/public/orders/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId,
        email: orderEmail,
        orderPublicId: orderBody.order.publicId,
      }),
    });
    expect(hit.status).toBe(200);
    const hitBody = (await hit.json()) as {
      order: { trackingNumber: string | null; carrier: string | null };
    };
    expect(hitBody.order.trackingNumber).toBe("TRACK-WAVE-C-1");
    expect(hitBody.order.carrier).toBe("Colissimo");

    const miss = await app.request("/v1/public/orders/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteId,
        email: "wrong@example.com",
        orderPublicId: orderBody.order.publicId,
      }),
    });
    expect(miss.status).toBe(404);
  });
});
