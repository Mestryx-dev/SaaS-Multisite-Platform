import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import {
  customerAddress,
  orderEvent,
  storeOrder,
  storeOrderItem,
} from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import {
  ensureStorefrontCustomer,
  mergeGuestCartIntoCustomer,
} from "./customer.js";

const CART_COOKIE = "mx_cart";

const addressBodySchema = z.object({
  siteId: z.string().uuid(),
  label: z.string().min(1).max(64).optional().default("Home"),
  name: z.string().min(1).max(200),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(32),
  country: z.string().length(2).default("FR"),
  isDefault: z.boolean().optional().default(false),
});

function serializeAddress(row: typeof customerAddress.$inferSelect) {
  return {
    id: row.id,
    siteId: row.siteId,
    label: row.label,
    name: row.name,
    line1: row.line1,
    line2: row.line2,
    city: row.city,
    postalCode: row.postalCode,
    country: row.country,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function requireStorefrontCustomer(
  db: Db,
  auth: Auth,
  headers: Headers,
  siteId: string,
): Promise<
  | { ok: true; cust: NonNullable<Awaited<ReturnType<typeof ensureStorefrontCustomer>>> }
  | { ok: false; status: 401 | 404; code: string; message: string }
> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    return { ok: false, status: 401, code: "UNAUTHORIZED", message: "Sign in required" };
  }
  const cust = await ensureStorefrontCustomer(db, {
    siteId,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  });
  if (!cust) {
    return { ok: false, status: 404, code: "NOT_FOUND", message: "Site not found" };
  }
  return { ok: true, cust };
}

async function clearDefaultAddresses(
  db: Db,
  siteId: string,
  customerId: string,
) {
  await db
    .update(customerAddress)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(
      and(
        eq(customerAddress.siteId, siteId),
        eq(customerAddress.customerId, customerId),
        eq(customerAddress.isDefault, true),
      ),
    );
}

export function storefrontAccountRoutes(
  db: Db,
  auth: Auth,
  config: AppConfig,
) {
  const app = new Hono();

  app.get("/storefront/me", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.query("siteId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }

    const cust = await ensureStorefrontCustomer(db, {
      siteId,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
    if (!cust) return apiError(c, 404, "NOT_FOUND", "Site not found");

    const token = getCookie(c, CART_COOKIE);
    if (token) {
      await mergeGuestCartIntoCustomer(db, {
        siteId,
        sessionToken: token,
        customerId: cust.id,
      });
    }

    return c.json({
      customer: {
        id: cust.id,
        email: cust.email,
        name: cust.name,
        siteId: cust.siteId,
        organizationId: cust.organizationId,
      },
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      googleOAuth: Boolean(config.googleClientId && config.googleClientSecret),
      appleOAuth: Boolean(config.appleClientId && config.appleClientSecret),
    });
  });

  app.get("/storefront/orders", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.query("siteId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }
    const cust = await ensureStorefrontCustomer(db, {
      siteId,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
    if (!cust) return apiError(c, 404, "NOT_FOUND", "Site not found");

    const orders = await db
      .select({
        publicId: storeOrder.publicId,
        status: storeOrder.status,
        currency: storeOrder.currency,
        subtotalCents: storeOrder.subtotalCents,
        shippingCents: storeOrder.shippingCents,
        taxCents: storeOrder.taxCents,
        totalCents: storeOrder.totalCents,
        createdAt: storeOrder.createdAt,
      })
      .from(storeOrder)
      .where(
        and(eq(storeOrder.siteId, siteId), eq(storeOrder.customerId, cust.id)),
      )
      .orderBy(desc(storeOrder.createdAt));

    return c.json({ orders });
  });

  app.get("/storefront/orders/:publicId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.query("siteId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }
    const cust = await ensureStorefrontCustomer(db, {
      siteId,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
    if (!cust) return apiError(c, 404, "NOT_FOUND", "Site not found");

    const [order] = await db
      .select()
      .from(storeOrder)
      .where(
        and(
          eq(storeOrder.publicId, c.req.param("publicId")),
          eq(storeOrder.siteId, siteId),
          eq(storeOrder.customerId, cust.id),
        ),
      )
      .limit(1);
    if (!order) return apiError(c, 404, "NOT_FOUND", "Order not found");

    const items = await db
      .select()
      .from(storeOrderItem)
      .where(eq(storeOrderItem.orderId, order.id));

    const events = await db
      .select({
        type: orderEvent.type,
        message: orderEvent.message,
        createdAt: orderEvent.createdAt,
      })
      .from(orderEvent)
      .where(eq(orderEvent.orderId, order.id))
      .orderBy(desc(orderEvent.createdAt))
      .limit(20);

    return c.json({
      order: {
        publicId: order.publicId,
        status: order.status,
        email: order.email,
        currency: order.currency,
        subtotalCents: order.subtotalCents,
        discountCents: order.discountCents,
        shippingCents: order.shippingCents,
        taxCents: order.taxCents,
        totalCents: order.totalCents,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        fulfilledAt: order.fulfilledAt,
        createdAt: order.createdAt,
      },
      items,
      events,
    });
  });

  /** Address book (FB-078) */
  app.get("/storefront/addresses", async (c) => {
    const siteId = c.req.query("siteId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }
    const authz = await requireStorefrontCustomer(
      db,
      auth,
      c.req.raw.headers,
      siteId,
    );
    if (!authz.ok) {
      return apiError(c, authz.status, authz.code, authz.message);
    }
    const { cust } = authz;

    const rows = await db
      .select()
      .from(customerAddress)
      .where(
        and(
          eq(customerAddress.siteId, siteId),
          eq(customerAddress.customerId, cust.id),
        ),
      )
      .orderBy(desc(customerAddress.isDefault), desc(customerAddress.updatedAt));

    return c.json({ addresses: rows.map(serializeAddress) });
  });

  app.post("/storefront/addresses", async (c) => {
    const parsed = addressBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const authz = await requireStorefrontCustomer(
      db,
      auth,
      c.req.raw.headers,
      parsed.data.siteId,
    );
    if (!authz.ok) {
      return apiError(c, authz.status, authz.code, authz.message);
    }
    const { cust } = authz;

    if (parsed.data.isDefault) {
      await clearDefaultAddresses(db, parsed.data.siteId, cust.id);
    }

    const [row] = await db
      .insert(customerAddress)
      .values({
        siteId: parsed.data.siteId,
        customerId: cust.id,
        label: parsed.data.label,
        name: parsed.data.name,
        line1: parsed.data.line1,
        line2: parsed.data.line2 ?? null,
        city: parsed.data.city,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
        isDefault: parsed.data.isDefault,
      })
      .returning();

    return c.json({ address: serializeAddress(row!) }, 201);
  });

  app.patch("/storefront/addresses/:addressId", async (c) => {
    const addressId = c.req.param("addressId");
    const body = z
      .object({
        siteId: z.string().uuid(),
        label: z.string().min(1).max(64).optional(),
        name: z.string().min(1).max(200).optional(),
        line1: z.string().min(1).max(200).optional(),
        line2: z.string().max(200).nullable().optional(),
        city: z.string().min(1).max(120).optional(),
        postalCode: z.string().min(1).max(32).optional(),
        country: z.string().length(2).optional(),
        isDefault: z.boolean().optional(),
      })
      .safeParse(await c.req.json());
    if (!body.success) {
      return apiError(c, 400, "VALIDATION_ERROR", body.error.message);
    }
    const authz = await requireStorefrontCustomer(
      db,
      auth,
      c.req.raw.headers,
      body.data.siteId,
    );
    if (!authz.ok) {
      return apiError(c, authz.status, authz.code, authz.message);
    }
    const { cust } = authz;

    const [existing] = await db
      .select()
      .from(customerAddress)
      .where(
        and(
          eq(customerAddress.id, addressId),
          eq(customerAddress.siteId, body.data.siteId),
          eq(customerAddress.customerId, cust.id),
        ),
      )
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Address not found");

    if (body.data.isDefault === true) {
      await clearDefaultAddresses(db, body.data.siteId, cust.id);
    }

    const [row] = await db
      .update(customerAddress)
      .set({
        ...(body.data.label !== undefined ? { label: body.data.label } : {}),
        ...(body.data.name !== undefined ? { name: body.data.name } : {}),
        ...(body.data.line1 !== undefined ? { line1: body.data.line1 } : {}),
        ...(body.data.line2 !== undefined ? { line2: body.data.line2 } : {}),
        ...(body.data.city !== undefined ? { city: body.data.city } : {}),
        ...(body.data.postalCode !== undefined
          ? { postalCode: body.data.postalCode }
          : {}),
        ...(body.data.country !== undefined ? { country: body.data.country } : {}),
        ...(body.data.isDefault !== undefined
          ? { isDefault: body.data.isDefault }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(customerAddress.id, addressId))
      .returning();

    return c.json({ address: serializeAddress(row!) });
  });

  app.delete("/storefront/addresses/:addressId", async (c) => {
    const siteId = c.req.query("siteId");
    const addressId = c.req.param("addressId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }
    const authz = await requireStorefrontCustomer(
      db,
      auth,
      c.req.raw.headers,
      siteId,
    );
    if (!authz.ok) {
      return apiError(c, authz.status, authz.code, authz.message);
    }
    const { cust } = authz;

    await db
      .delete(customerAddress)
      .where(
        and(
          eq(customerAddress.id, addressId),
          eq(customerAddress.siteId, siteId),
          eq(customerAddress.customerId, cust.id),
        ),
      );
    return c.json({ ok: true });
  });

  return app;
}
