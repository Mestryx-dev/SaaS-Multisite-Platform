import { and, asc, desc, eq, gte, ilike, isNull, lte, or } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import {
  cart,
  cartItem,
  category,
  customerAddress,
  invoice,
  orderEvent,
  organization,
  product,
  productCategory,
  productVariant,
  site,
  storeOrder,
  storeOrderItem,
  wishlistItem,
} from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { apiError } from "../../lib/errors.js";
import type { Auth } from "../identity/auth.js";
import { assertOrgRole } from "../identity/rbac.js";
import { sendOrderEmail } from "../email/send.js";
import { normalizeEmailLocale } from "../email/i18n.js";
import {
  ensureDefaultVariant,
  syncProductStockFromVariants,
} from "./catalog-routes.js";
import {
  cancelOrder,
  exportAccountingCsv,
  fulfillOrder,
  issueCreditNote,
  listLowStockProducts,
  loadOrderBundle,
  markOrderPaid,
  renderDocumentHtml,
  renderDocumentPdf,
  renderInvoiceHtml,
  renderInvoicePdf,
  salesVatReport,
} from "./order-ops.js";
import {
  findActiveCoupon,
  incrementCouponRedemption,
  validateCouponForCheckout,
} from "./coupons.js";
import {
  ensureStorefrontCustomer,
  getOrCreateCartForSession,
} from "./customer.js";
import { listShippingQuotes } from "./shipping-routes.js";
import { listProductGallery } from "./media-routes.js";
import { taxFromInclusive } from "./tax.js";

const CART_COOKIE = "mx_cart";

const productCreateSchema = z.object({
  organizationId: z.string().uuid(),
  /** Optional: publish to a storefront site; omit/null = catalog only */
  siteId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().min(1).max(64),
  description: z.string().max(5000).optional(),
  priceCents: z.number().int().min(0),
  compareAtCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).optional(),
  taxClass: z.enum(["standard", "reduced", "super_reduced", "zero", "exempt"]).optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).nullable().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const productUpdateSchema = productCreateSchema
  .partial()
  .omit({ organizationId: true });

const cartAddSchema = z.object({
  siteId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(99).default(1),
});

const wishlistSchema = z.object({
  siteId: z.string().uuid(),
  productId: z.string().uuid(),
});

const shippingAddressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2).default("FR"),
});

const checkoutSchema = z
  .object({
    siteId: z.string().uuid(),
    email: z.string().email(),
    shippingAddress: shippingAddressSchema.optional(),
    shippingAddressId: z.string().uuid().optional(),
    billingSameAsShipping: z.boolean().optional().default(true),
    shippingMethodId: z.string().uuid().optional(),
    shippingCents: z.number().int().min(0).optional().default(0),
    couponCode: z.string().min(1).max(64).optional(),
  })
  .refine((d) => Boolean(d.shippingAddress || d.shippingAddressId), {
    message: "shippingAddress or shippingAddressId required",
  });

const orderLookupSchema = z.object({
  siteId: z.string().uuid(),
  email: z.string().email(),
  orderPublicId: z.string().min(1).max(64),
});

function ensureSessionToken(c: Context): string {
  const existing = getCookie(c, CART_COOKIE);
  if (existing) return existing;
  return randomBytes(24).toString("hex");
}

async function loadSite(db: Db, siteId: string) {
  const [row] = await db.select().from(site).where(eq(site.id, siteId)).limit(1);
  return row ?? null;
}

async function resolveCustomerId(
  db: Db,
  auth: Auth,
  headers: Headers,
  siteId: string,
): Promise<string | null> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user) return null;
  const cust = await ensureStorefrontCustomer(db, {
    siteId,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  });
  return cust?.id ?? null;
}

async function cartPayload(db: Db, cartId: string) {
  const items = await db
    .select({
      id: cartItem.id,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
      unitPriceCents: cartItem.unitPriceCents,
      name: product.name,
      slug: product.slug,
      sku: productVariant.sku,
      stock: productVariant.stock,
      status: productVariant.status,
      optionsJson: productVariant.optionsJson,
      imageUrl: product.imageUrl,
      taxClass: product.taxClass,
      currency: product.currency,
    })
    .from(cartItem)
    .innerJoin(product, eq(cartItem.productId, product.id))
    .innerJoin(productVariant, eq(cartItem.variantId, productVariant.id))
    .where(eq(cartItem.cartId, cartId));

  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  return { items, subtotalCents };
}

export function commerceRoutes(db: Db, auth: Auth, config: AppConfig) {
  const app = new Hono();

  /** Admin — create product in org catalog (optional site publish) */
  app.post("/products", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const parsed = productCreateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    const access = await assertOrgRole(
      db,
      session.user.id,
      parsed.data.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const [orgRow] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, parsed.data.organizationId))
      .limit(1);
    const orgMods = (orgRow?.modulesAllowed ?? []) as string[];
    if (!orgMods.includes("commerce")) {
      return apiError(c, 403, "MODULE_DISABLED", "Commerce module not enabled");
    }

    let publishSiteId: string | null = parsed.data.siteId ?? null;
    if (publishSiteId) {
      const siteRow = await loadSite(db, publishSiteId);
      if (!siteRow || siteRow.organizationId !== parsed.data.organizationId) {
        return apiError(c, 400, "VALIDATION_ERROR", "siteId must belong to organization");
      }
    }

    const [created] = await db
      .insert(product)
      .values({
        organizationId: parsed.data.organizationId,
        siteId: publishSiteId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        sku: parsed.data.sku,
        description: parsed.data.description,
        priceCents: parsed.data.priceCents,
        compareAtCents: parsed.data.compareAtCents ?? null,
        currency: parsed.data.currency ?? "eur",
        taxClass: parsed.data.taxClass ?? "standard",
        stock: parsed.data.stock ?? 0,
        lowStockThreshold: parsed.data.lowStockThreshold ?? null,
        status: parsed.data.status ?? "draft",
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
        imageUrl: parsed.data.imageUrl || null,
      })
      .returning();

    const variant = await ensureDefaultVariant(db, created!);
    return c.json({ product: created, variant }, 201);
  });

  /** Admin — full org catalog (includes unpublished / no site yet) */
  app.get("/organizations/:orgId/products", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const products = await db
      .select()
      .from(product)
      .where(eq(product.organizationId, orgId));
    return c.json({ products });
  });

  app.get("/sites/:siteId/products", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.param("siteId");
    const siteRow = await loadSite(db, siteId);
    if (!siteRow) return apiError(c, 404, "NOT_FOUND", "Site not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const products = await db.select().from(product).where(eq(product.siteId, siteId));
    return c.json({ products });
  });

  app.patch("/products/:productId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const productId = c.req.param("productId");
    const [existing] = await db
      .select()
      .from(product)
      .where(eq(product.id, productId))
      .limit(1);
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Product not found");

    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const parsed = productUpdateSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }

    if (parsed.data.siteId) {
      const siteRow = await loadSite(db, parsed.data.siteId);
      if (!siteRow || siteRow.organizationId !== existing.organizationId) {
        return apiError(c, 400, "VALIDATION_ERROR", "siteId must belong to organization");
      }
    }

    const [updated] = await db
      .update(product)
      .set({
        ...parsed.data,
        siteId:
          parsed.data.siteId === undefined
            ? existing.siteId
            : parsed.data.siteId,
        imageUrl:
          parsed.data.imageUrl === ""
            ? null
            : (parsed.data.imageUrl ?? existing.imageUrl),
        updatedAt: new Date(),
      })
      .where(eq(product.id, productId))
      .returning();

    return c.json({ product: updated });
  });

  app.get("/sites/:siteId/orders", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const siteId = c.req.param("siteId");
    const siteRow = await loadSite(db, siteId);
    if (!siteRow) return apiError(c, 404, "NOT_FOUND", "Site not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      siteRow.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const orders = await db
      .select()
      .from(storeOrder)
      .where(eq(storeOrder.siteId, siteId));
    return c.json({ orders });
  });

  app.get("/organizations/:orgId/orders", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const orders = await db
      .select()
      .from(storeOrder)
      .where(eq(storeOrder.organizationId, orgId));
    return c.json({ orders });
  });

  app.get("/orders/:orderId", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const bundle = await loadOrderBundle(db, c.req.param("orderId"));
    if (!bundle) return apiError(c, 404, "NOT_FOUND", "Order not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      bundle.order.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    return c.json(bundle);
  });

  app.post("/orders/:orderId/mark-paid", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const existing = await loadOrderBundle(db, c.req.param("orderId"));
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Order not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.order.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const result = await markOrderPaid(db, c.req.param("orderId"), config);
    if (!result.ok) {
      if (result.code === "NOT_FOUND") {
        return apiError(c, 404, "NOT_FOUND", "Order not found");
      }
      return apiError(c, 400, "INVALID_STATUS", "Order cannot be marked paid");
    }
    return c.json({
      order: result.order,
      invoice: result.invoice,
      idempotent: result.idempotent,
    });
  });

  app.post("/orders/:orderId/cancel", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const existing = await loadOrderBundle(db, c.req.param("orderId"));
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Order not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.order.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const result = await cancelOrder(db, c.req.param("orderId"), config);
    if (!result.ok) {
      if (result.code === "NOT_FOUND") {
        return apiError(c, 404, "NOT_FOUND", "Order not found");
      }
      return apiError(c, 400, "INVALID_STATUS", "Only pending_payment orders can be cancelled");
    }
    return c.json({ order: result.order });
  });

  app.post("/orders/:orderId/fulfill", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const existing = await loadOrderBundle(db, c.req.param("orderId"));
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Order not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.order.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const body = z
      .object({
        carrier: z.string().max(120).optional(),
        trackingNumber: z.string().max(120).optional(),
      })
      .safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) {
      return apiError(c, 400, "VALIDATION_ERROR", body.error.message);
    }

    const result = await fulfillOrder(db, c.req.param("orderId"), config, body.data);
    if (!result.ok) {
      if (result.code === "NOT_FOUND") {
        return apiError(c, 404, "NOT_FOUND", "Order not found");
      }
      return apiError(c, 400, "INVALID_STATUS", "Only paid orders can be fulfilled");
    }
    return c.json({ order: result.order, idempotent: result.idempotent });
  });

  app.post("/orders/:orderId/credit-note", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const existing = await loadOrderBundle(db, c.req.param("orderId"));
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Order not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.order.organizationId,
      "editor",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const result = await issueCreditNote(db, c.req.param("orderId"), config);
    if (!result.ok) {
      if (result.code === "NOT_FOUND") {
        return apiError(c, 404, "NOT_FOUND", "Order not found");
      }
      if (result.code === "NO_INVOICE") {
        return apiError(c, 400, "NO_INVOICE", "Sales invoice required first");
      }
      return apiError(
        c,
        400,
        "INVALID_STATUS",
        "Credit notes require paid or fulfilled orders",
      );
    }
    return c.json({
      order: result.order,
      invoice: result.invoice,
      idempotent: result.idempotent,
    });
  });

  app.get("/invoices/:invoiceId.pdf", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const invoiceId = c.req.param("invoiceId");
    if (!invoiceId) return apiError(c, 400, "VALIDATION_ERROR", "invoiceId required");
    const [inv] = await db
      .select()
      .from(invoice)
      .where(eq(invoice.id, invoiceId))
      .limit(1);
    if (!inv) return apiError(c, 404, "NOT_FOUND", "Invoice not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      inv.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const rendered = await renderDocumentPdf(db, inv.id);
    if (!rendered) return apiError(c, 404, "NOT_FOUND", "Invoice not found");
    return new Response(Buffer.from(rendered.bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${rendered.number}.pdf"`,
      },
    });
  });

  app.get("/invoices/:invoiceId.html", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const invoiceId = c.req.param("invoiceId");
    if (!invoiceId) return apiError(c, 400, "VALIDATION_ERROR", "invoiceId required");
    const [inv] = await db
      .select()
      .from(invoice)
      .where(eq(invoice.id, invoiceId))
      .limit(1);
    if (!inv) return apiError(c, 404, "NOT_FOUND", "Invoice not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      inv.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const rendered = await renderDocumentHtml(db, inv.id);
    if (!rendered) return apiError(c, 404, "NOT_FOUND", "Invoice not found");
    return c.html(rendered.html);
  });

  app.get("/organizations/:orgId/reports/sales", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const from = c.req.query("from") ? new Date(c.req.query("from")!) : undefined;
    const to = c.req.query("to") ? new Date(c.req.query("to")!) : undefined;
    const report = await salesVatReport(db, orgId, from, to);
    return c.json({ report });
  });

  app.get("/organizations/:orgId/stock-alerts", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);
    const products = await listLowStockProducts(db, orgId);
    return c.json({ products });
  });

  app.get("/orders/:orderId/invoice.pdf", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const existing = await loadOrderBundle(db, c.req.param("orderId"));
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Order not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.order.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const pdf = await renderInvoicePdf(db, c.req.param("orderId"));
    if (!pdf) return apiError(c, 404, "NOT_FOUND", "Invoice not found — mark order paid first");
    return new Response(Buffer.from(pdf.bytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${pdf.number}.pdf"`,
      },
    });
  });

  app.get("/orders/:orderId/invoice.html", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const existing = await loadOrderBundle(db, c.req.param("orderId"));
    if (!existing) return apiError(c, 404, "NOT_FOUND", "Order not found");
    const access = await assertOrgRole(
      db,
      session.user.id,
      existing.order.organizationId,
      "viewer",
    );
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const doc = await renderInvoiceHtml(db, c.req.param("orderId"));
    if (!doc) return apiError(c, 404, "NOT_FOUND", "Invoice not found — mark order paid first");
    return c.html(doc.html);
  });

  app.get("/organizations/:orgId/exports/accounting.csv", async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) {
      return apiError(c, 401, "UNAUTHORIZED", "Sign in required");
    }
    const orgId = c.req.param("orgId");
    const access = await assertOrgRole(db, session.user.id, orgId, "viewer");
    if (!access.ok) return apiError(c, 403, access.code, access.message);

    const fromQ = c.req.query("from");
    const toQ = c.req.query("to");
    const from = fromQ ? new Date(fromQ) : undefined;
    const to = toQ ? new Date(toQ) : undefined;
    const csv = await exportAccountingCsv(db, orgId, from, to);
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="accounting-${orgId.slice(0, 8)}.csv"`,
      },
    });
  });

  app.get("/public/orders/:publicId", async (c) => {
    const publicId = c.req.param("publicId");
    const [order] = await db
      .select()
      .from(storeOrder)
      .where(eq(storeOrder.publicId, publicId))
      .limit(1);
    if (!order) return apiError(c, 404, "NOT_FOUND", "Order not found");
    const items = await db
      .select()
      .from(storeOrderItem)
      .where(eq(storeOrderItem.orderId, order.id));
    return c.json({
      order: {
        publicId: order.publicId,
        status: order.status,
        email: order.email,
        currency: order.currency,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        taxCents: order.taxCents,
        totalCents: order.totalCents,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
      },
      items,
    });
  });

  /** Guest order tracking lookup (FB-080) — email + publicId must match. */
  app.post("/public/orders/lookup", async (c) => {
    const parsed = orderLookupSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const [order] = await db
      .select()
      .from(storeOrder)
      .where(
        and(
          eq(storeOrder.publicId, parsed.data.orderPublicId),
          eq(storeOrder.siteId, parsed.data.siteId),
        ),
      )
      .limit(1);
    if (
      !order ||
      order.email.toLowerCase() !== parsed.data.email.toLowerCase()
    ) {
      return apiError(c, 404, "NOT_FOUND", "Order not found");
    }
    return c.json({
      order: {
        publicId: order.publicId,
        status: order.status,
        currency: order.currency,
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        taxCents: order.taxCents,
        totalCents: order.totalCents,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
        fulfilledAt: order.fulfilledAt,
        createdAt: order.createdAt,
      },
    });
  });

  /** Public catalog */
  app.get("/public/sites/:siteId/products", async (c) => {
    const siteId = c.req.param("siteId");
    const categorySlug = c.req.query("category");
    const qRaw = (c.req.query("q") ?? "").trim();
    const minPriceRaw = c.req.query("minPrice");
    const maxPriceRaw = c.req.query("maxPrice");
    const sortRaw = (c.req.query("sort") ?? "newest").trim();

    const filters = [eq(product.siteId, siteId), eq(product.status, "active")];
    if (qRaw) {
      const pattern = `%${qRaw.replace(/[%_]/g, "\\$&")}%`;
      filters.push(
        or(
          ilike(product.name, pattern),
          ilike(product.slug, pattern),
          ilike(product.description, pattern),
        )!,
      );
    }
    if (minPriceRaw != null && minPriceRaw !== "") {
      const minPrice = Number.parseInt(minPriceRaw, 10);
      if (!Number.isNaN(minPrice) && minPrice >= 0) {
        filters.push(gte(product.priceCents, minPrice));
      }
    }
    if (maxPriceRaw != null && maxPriceRaw !== "") {
      const maxPrice = Number.parseInt(maxPriceRaw, 10);
      if (!Number.isNaN(maxPrice) && maxPrice >= 0) {
        filters.push(lte(product.priceCents, maxPrice));
      }
    }

    const orderBy =
      sortRaw === "price_asc"
        ? asc(product.priceCents)
        : sortRaw === "price_desc"
          ? desc(product.priceCents)
          : desc(product.createdAt);

    let products = await db
      .select()
      .from(product)
      .where(and(...filters))
      .orderBy(orderBy);

    if (categorySlug) {
      const siteRow = await loadSite(db, siteId);
      if (!siteRow) return c.json({ products: [] });
      const [cat] = await db
        .select()
        .from(category)
        .where(
          and(
            eq(category.organizationId, siteRow.organizationId),
            eq(category.slug, categorySlug),
            or(eq(category.siteId, siteId), isNull(category.siteId)),
          ),
        )
        .limit(1);
      if (!cat) return c.json({ products: [] });
      const links = await db
        .select({ productId: productCategory.productId })
        .from(productCategory)
        .where(eq(productCategory.categoryId, cat.id));
      const ids = new Set(links.map((l) => l.productId));
      products = products.filter((p) => ids.has(p.id));
    }

    return c.json({ products });
  });

  app.get("/public/sites/:siteId/products/:slug", async (c) => {
    const siteId = c.req.param("siteId");
    const slug = c.req.param("slug");
    const [row] = await db
      .select()
      .from(product)
      .where(
        and(
          eq(product.siteId, siteId),
          eq(product.slug, slug),
          eq(product.status, "active"),
        ),
      )
      .limit(1);
    if (!row) return apiError(c, 404, "NOT_FOUND", "Product not found");
    const variants = await db
      .select()
      .from(productVariant)
      .where(
        and(
          eq(productVariant.productId, row.id),
          eq(productVariant.status, "active"),
        ),
      );
    const gallery = await listProductGallery(db, row.id);
    return c.json({
      product: row,
      variants,
      media: gallery.map((g) => ({
        id: g.id,
        url: g.url,
        alt: g.alt,
        sortOrder: g.sortOrder,
      })),
    });
  });

  /** Cart */
  app.get("/public/cart", async (c) => {
    const siteId = c.req.query("siteId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }
    const token = ensureSessionToken(c);
    setCookie(c, CART_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    const customerId = await resolveCustomerId(db, auth, c.req.raw.headers, siteId);
    const cartRow = await getOrCreateCartForSession(
      db,
      siteId,
      token,
      customerId,
    );
    const payload = await cartPayload(db, cartRow.id);
    return c.json({ cart: { id: cartRow.id, ...payload } });
  });

  app.post("/public/cart/items", async (c) => {
    const parsed = cartAddSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const token = ensureSessionToken(c);
    setCookie(c, CART_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    const [prod] = await db
      .select()
      .from(product)
      .where(
        and(
          eq(product.id, parsed.data.productId),
          eq(product.siteId, parsed.data.siteId),
          eq(product.status, "active"),
        ),
      )
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");

    let variant =
      parsed.data.variantId != null
        ? (
            await db
              .select()
              .from(productVariant)
              .where(
                and(
                  eq(productVariant.id, parsed.data.variantId),
                  eq(productVariant.productId, prod.id),
                  eq(productVariant.status, "active"),
                ),
              )
              .limit(1)
          )[0]
        : undefined;
    if (!variant) {
      variant = await ensureDefaultVariant(db, prod);
    }
    if (!variant || variant.status !== "active") {
      return apiError(c, 404, "NOT_FOUND", "Variant not found");
    }
    if (variant.stock < parsed.data.quantity) {
      return apiError(c, 400, "OUT_OF_STOCK", "Not enough stock");
    }

    const customerId = await resolveCustomerId(
      db,
      auth,
      c.req.raw.headers,
      parsed.data.siteId,
    );
    const cartRow = await getOrCreateCartForSession(
      db,
      parsed.data.siteId,
      token,
      customerId,
    );
    const [existingItem] = await db
      .select()
      .from(cartItem)
      .where(
        and(eq(cartItem.cartId, cartRow.id), eq(cartItem.variantId, variant.id)),
      )
      .limit(1);

    if (existingItem) {
      const nextQty = existingItem.quantity + parsed.data.quantity;
      if (variant.stock < nextQty) {
        return apiError(c, 400, "OUT_OF_STOCK", "Not enough stock");
      }
      await db
        .update(cartItem)
        .set({ quantity: nextQty, unitPriceCents: variant.priceCents })
        .where(eq(cartItem.id, existingItem.id));
    } else {
      await db.insert(cartItem).values({
        cartId: cartRow.id,
        productId: prod.id,
        variantId: variant.id,
        quantity: parsed.data.quantity,
        unitPriceCents: variant.priceCents,
      });
    }

    const payload = await cartPayload(db, cartRow.id);
    return c.json({ cart: { id: cartRow.id, ...payload } }, 201);
  });

  app.patch("/public/cart/items/:itemId", async (c) => {
    const itemId = c.req.param("itemId");
    const body = z
      .object({ quantity: z.number().int().min(0).max(99) })
      .safeParse(await c.req.json());
    if (!body.success) {
      return apiError(c, 400, "VALIDATION_ERROR", body.error.message);
    }
    const [item] = await db
      .select()
      .from(cartItem)
      .where(eq(cartItem.id, itemId))
      .limit(1);
    if (!item) return apiError(c, 404, "NOT_FOUND", "Cart item not found");

    if (body.data.quantity === 0) {
      await db.delete(cartItem).where(eq(cartItem.id, itemId));
    } else {
      await db
        .update(cartItem)
        .set({ quantity: body.data.quantity })
        .where(eq(cartItem.id, itemId));
    }
    const payload = await cartPayload(db, item.cartId);
    return c.json({ cart: { id: item.cartId, ...payload } });
  });

  /** Wishlist */
  app.get("/public/wishlist", async (c) => {
    const siteId = c.req.query("siteId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }
    const token = ensureSessionToken(c);
    setCookie(c, CART_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    const items = await db
      .select({
        id: wishlistItem.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        priceCents: product.priceCents,
        currency: product.currency,
        imageUrl: product.imageUrl,
        status: product.status,
      })
      .from(wishlistItem)
      .innerJoin(product, eq(wishlistItem.productId, product.id))
      .where(
        and(eq(wishlistItem.siteId, siteId), eq(wishlistItem.sessionToken, token)),
      );
    return c.json({ items });
  });

  app.post("/public/wishlist/items", async (c) => {
    const parsed = wishlistSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const token = ensureSessionToken(c);
    setCookie(c, CART_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    const [prod] = await db
      .select()
      .from(product)
      .where(
        and(
          eq(product.id, parsed.data.productId),
          eq(product.siteId, parsed.data.siteId),
        ),
      )
      .limit(1);
    if (!prod) return apiError(c, 404, "NOT_FOUND", "Product not found");

    await db
      .insert(wishlistItem)
      .values({
        siteId: parsed.data.siteId,
        sessionToken: token,
        productId: prod.id,
      })
      .onConflictDoNothing();

    return c.json({ ok: true }, 201);
  });

  app.delete("/public/wishlist/items/:productId", async (c) => {
    const siteId = c.req.query("siteId");
    const productId = c.req.param("productId");
    if (!siteId || !z.string().uuid().safeParse(siteId).success) {
      return apiError(c, 400, "VALIDATION_ERROR", "siteId query required");
    }
    const token = getCookie(c, CART_COOKIE);
    if (!token) return c.json({ ok: true });
    await db
      .delete(wishlistItem)
      .where(
        and(
          eq(wishlistItem.siteId, siteId),
          eq(wishlistItem.sessionToken, token),
          eq(wishlistItem.productId, productId),
        ),
      );
    return c.json({ ok: true });
  });

  /**
   * Checkout → order pending_payment (no Stripe yet).
   * Clears cart after order creation.
   */
  app.post("/public/checkout", async (c) => {
    const parsed = checkoutSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return apiError(c, 400, "VALIDATION_ERROR", parsed.error.message);
    }
    const token = getCookie(c, CART_COOKIE);
    if (!token) {
      return apiError(c, 400, "EMPTY_CART", "No cart session");
    }

    const siteRow = await loadSite(db, parsed.data.siteId);
    if (!siteRow) return apiError(c, 404, "NOT_FOUND", "Site not found");

    const customerId = await resolveCustomerId(
      db,
      auth,
      c.req.raw.headers,
      parsed.data.siteId,
    );

    let address = parsed.data.shippingAddress ?? null;
    if (parsed.data.shippingAddressId) {
      if (!customerId) {
        return apiError(
          c,
          401,
          "UNAUTHORIZED",
          "Sign in required to use a saved address",
        );
      }
      const [saved] = await db
        .select()
        .from(customerAddress)
        .where(
          and(
            eq(customerAddress.id, parsed.data.shippingAddressId),
            eq(customerAddress.siteId, parsed.data.siteId),
            eq(customerAddress.customerId, customerId),
          ),
        )
        .limit(1);
      if (!saved) {
        return apiError(c, 400, "INVALID_ADDRESS", "Saved address not found");
      }
      address = {
        name: saved.name,
        line1: saved.line1,
        line2: saved.line2 ?? undefined,
        city: saved.city,
        postalCode: saved.postalCode,
        country: saved.country,
      };
    }
    if (!address) {
      return apiError(
        c,
        400,
        "VALIDATION_ERROR",
        "shippingAddress or shippingAddressId required",
      );
    }

    const cartRow = await getOrCreateCartForSession(
      db,
      parsed.data.siteId,
      token,
      customerId,
    );

    const payload = await cartPayload(db, cartRow.id);
    if (payload.items.length === 0) {
      return apiError(c, 400, "EMPTY_CART", "Cart is empty");
    }

    for (const item of payload.items) {
      if (item.status !== "active" || item.stock < item.quantity) {
        return apiError(
          c,
          400,
          "OUT_OF_STOCK",
          `Product ${item.slug} is unavailable`,
        );
      }
    }

    const shippingQuotes = await listShippingQuotes(
      db,
      parsed.data.siteId,
      address.country,
    );
    let shippingCents = 0;
    let shippingMethodId: string | null = null;
    if (shippingQuotes && shippingQuotes.methods.length > 0) {
      const chosen = parsed.data.shippingMethodId
        ? shippingQuotes.methods.find((m) => m.id === parsed.data.shippingMethodId)
        : shippingQuotes.methods[0];
      if (!chosen) {
        return apiError(
          c,
          400,
          "INVALID_SHIPPING",
          "shippingMethodId is not available for this country",
        );
      }
      shippingCents = chosen.priceCents;
      shippingMethodId = chosen.id;
    } else {
      shippingCents = parsed.data.shippingCents ?? 0;
    }
    const subtotalCents = payload.subtotalCents;
    let taxCents = 0;
    for (const item of payload.items) {
      taxCents += taxFromInclusive(
        item.unitPriceCents * item.quantity,
        item.taxClass,
      );
    }

    let discountCents = 0;
    let couponId: string | null = null;
    let couponCodeSnap: string | null = null;
    if (parsed.data.couponCode) {
      const row = await findActiveCoupon(
        db,
        siteRow.organizationId,
        parsed.data.couponCode,
      );
      if (!row) {
        return apiError(c, 400, "COUPON_INVALID", "Coupon not found");
      }
      const check = validateCouponForCheckout(row, subtotalCents);
      if (!check.ok) {
        return apiError(c, 400, check.code, check.message);
      }
      discountCents = check.discountCents;
      couponId = row.id;
      couponCodeSnap = row.code;
    }

    const totalCents = subtotalCents - discountCents + shippingCents;
    const publicId = `ord_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

    const [order] = await db
      .insert(storeOrder)
      .values({
        publicId,
        organizationId: siteRow.organizationId,
        siteId: siteRow.id,
        customerId,
        email: parsed.data.email,
        status: "pending_payment",
        currency: payload.items[0]?.currency ?? "eur",
        subtotalCents,
        discountCents,
        shippingCents,
        taxCents,
        totalCents,
        couponId,
        couponCode: couponCodeSnap,
        shippingMethodId,
        shippingAddressJson: address,
        billingAddressJson: parsed.data.billingSameAsShipping
          ? address
          : address,
      })
      .returning();

    await db.insert(storeOrderItem).values(
      payload.items.map((item) => ({
        orderId: order!.id,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        taxClass: item.taxClass,
      })),
    );

    if (couponId) {
      await incrementCouponRedemption(db, couponId);
    }

    // Reserve stock at checkout (payment deferred) — variant level
    for (const item of payload.items) {
      await db
        .update(productVariant)
        .set({ stock: item.stock - item.quantity, updatedAt: new Date() })
        .where(eq(productVariant.id, item.variantId));
      await syncProductStockFromVariants(db, item.productId);
    }

    await db.delete(cartItem).where(eq(cartItem.cartId, cartRow.id));

    await db.insert(orderEvent).values({
      orderId: order!.id,
      type: "created",
      message: couponCodeSnap
        ? `Order created (pending_payment); coupon ${couponCodeSnap}`
        : "Order created (pending_payment)",
    });
    await sendOrderEmail(config, {
      type: "order_confirmation",
      to: order!.email,
      orderPublicId: order!.publicId,
      totalCents: order!.totalCents,
      currency: order!.currency,
      locale: normalizeEmailLocale(siteRow.defaultLocale),
    });

    return c.json(
      {
        order: {
          id: order!.id,
          publicId: order!.publicId,
          status: order!.status,
          email: order!.email,
          subtotalCents: order!.subtotalCents,
          discountCents: order!.discountCents,
          shippingCents: order!.shippingCents,
          taxCents: order!.taxCents,
          totalCents: order!.totalCents,
          currency: order!.currency,
          couponCode: order!.couponCode,
        },
        payment: {
          required: true,
          provider: "deferred",
          message: "Payment integration not enabled yet. Order is pending_payment.",
        },
      },
      201,
    );
  });

  return app;
}
