import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import {
  invoice,
  orderEvent,
  product,
  productVariant,
  storeOrder,
  storeOrderItem,
} from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { resolveSiteEmailLocale } from "../email/i18n.js";
import { sendOrderEmail } from "../email/send.js";
import {
  accountingRowsToCsv,
  journalLinesForCreditNote,
  journalLinesForPaidOrder,
} from "./accounting-csv.js";
import { syncProductStockFromVariants } from "./catalog-routes.js";
import {
  allocateInvoiceNumberInTx,
  getOrDefaultLegalProfile,
} from "./invoice-number.js";
import {
  buildInvoiceHtml,
  buildInvoicePdf,
  buildInvoiceTotalsJson,
  type InvoiceLine,
  type InvoicePdfInput,
} from "./invoice-pdf.js";
import { taxFromInclusive } from "./tax.js";

export async function loadOrderBundle(db: Db, orderId: string) {
  const [order] = await db
    .select()
    .from(storeOrder)
    .where(eq(storeOrder.id, orderId))
    .limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(storeOrderItem)
    .where(eq(storeOrderItem.orderId, orderId));
  const events = await db
    .select()
    .from(orderEvent)
    .where(eq(orderEvent.orderId, orderId))
    .orderBy(desc(orderEvent.createdAt));
  const invoices = await db
    .select()
    .from(invoice)
    .where(eq(invoice.orderId, orderId))
    .orderBy(desc(invoice.issuedAt));
  const salesInvoice =
    invoices.find((i) => i.kind === "invoice") ?? null;

  const vatBreakdown = items.map((i) => {
    const lineTotal = i.unitPriceCents * i.quantity;
    const tax = taxFromInclusive(lineTotal, i.taxClass);
    return {
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      lineTotalCents: lineTotal,
      taxClass: i.taxClass,
      taxCents: tax,
      htCents: lineTotal - tax,
    };
  });

  return {
    order,
    items,
    events,
    invoice: salesInvoice,
    invoices,
    vatBreakdown,
  };
}

async function addEvent(db: Db, orderId: string, type: string, message: string) {
  await db.insert(orderEvent).values({ orderId, type, message });
}

function toInvoiceLines(
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    taxClass: string;
  }>,
): InvoiceLine[] {
  return items.map((i) => ({
    name: i.name,
    sku: i.sku,
    quantity: i.quantity,
    unitPriceCents: i.unitPriceCents,
    taxClass: i.taxClass,
  }));
}

async function buildPdfInput(
  db: Db,
  order: typeof storeOrder.$inferSelect,
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    taxClass: string;
  }>,
  number: string,
  issuedAt: Date,
  documentKind: "invoice" | "credit_note" = "invoice",
): Promise<InvoicePdfInput> {
  const merchant = await getOrDefaultLegalProfile(db, order.organizationId);
  return {
    number,
    issuedAt,
    currency: order.currency,
    email: order.email,
    documentKind,
    merchant: {
      legalName: merchant.legalName,
      siret: merchant.siret,
      vatNumber: merchant.vatNumber,
      addressJson: merchant.addressJson,
      rcs: merchant.rcs,
      capital: merchant.capital,
    },
    customerAddress: order.billingAddressJson,
    lines: toInvoiceLines(items),
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents ?? 0,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
  };
}

export async function markOrderPaid(
  db: Db,
  orderId: string,
  config: AppConfig,
) {
  const bundle = await loadOrderBundle(db, orderId);
  if (!bundle) return { ok: false as const, code: "NOT_FOUND" as const };

  if (bundle.order.status === "paid" && bundle.invoice) {
    return {
      ok: true as const,
      order: bundle.order,
      invoice: bundle.invoice,
      idempotent: true,
    };
  }
  if (bundle.order.status !== "pending_payment") {
    return { ok: false as const, code: "INVALID_STATUS" as const };
  }

  const merchant = await getOrDefaultLegalProfile(db, bundle.order.organizationId);
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const number = await allocateInvoiceNumberInTx(
      tx,
      bundle.order.organizationId,
      merchant.invoicePrefix,
    );
    const totalsJson = buildInvoiceTotalsJson({
      lines: toInvoiceLines(bundle.items),
      subtotalCents: bundle.order.subtotalCents,
      discountCents: bundle.order.discountCents ?? 0,
      shippingCents: bundle.order.shippingCents,
      taxCents: bundle.order.taxCents,
      totalCents: bundle.order.totalCents,
      currency: bundle.order.currency,
    });

    const [updated] = await tx
      .update(storeOrder)
      .set({
        status: "paid",
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(storeOrder.id, orderId))
      .returning();

    const [createdInv] = await tx
      .insert(invoice)
      .values({
        organizationId: bundle.order.organizationId,
        siteId: bundle.order.siteId,
        orderId,
        number,
        kind: "invoice",
        issuedAt: now,
        totalsJson,
        pdfReady: true,
      })
      .returning();

    await tx.insert(orderEvent).values({
      orderId,
      type: "mark_paid",
      message: `Marked paid; invoice ${number}`,
    });

    return { order: updated!, invoice: createdInv! };
  });

  await sendOrderEmail(config, {
    type: "order_paid",
    to: bundle.order.email,
    orderPublicId: bundle.order.publicId,
    totalCents: result.order.totalCents,
    currency: result.order.currency,
    invoiceNumber: result.invoice.number,
    locale: await resolveSiteEmailLocale(db, bundle.order.siteId),
  });

  return { ok: true as const, ...result, idempotent: false };
}

export async function fulfillOrder(
  db: Db,
  orderId: string,
  config: AppConfig,
  input: { carrier?: string; trackingNumber?: string },
) {
  const bundle = await loadOrderBundle(db, orderId);
  if (!bundle) return { ok: false as const, code: "NOT_FOUND" as const };
  if (bundle.order.status === "fulfilled") {
    return { ok: true as const, order: bundle.order, idempotent: true };
  }
  if (bundle.order.status !== "paid") {
    return { ok: false as const, code: "INVALID_STATUS" as const };
  }

  const now = new Date();
  const carrier = input.carrier?.trim() || null;
  const trackingNumber = input.trackingNumber?.trim() || null;

  const [updated] = await db
    .update(storeOrder)
    .set({
      status: "fulfilled",
      carrier,
      trackingNumber,
      fulfilledAt: now,
      updatedAt: now,
    })
    .where(eq(storeOrder.id, orderId))
    .returning();

  await addEvent(
    db,
    orderId,
    "fulfilled",
    trackingNumber
      ? `Shipped via ${carrier ?? "carrier"} · ${trackingNumber}`
      : `Marked fulfilled${carrier ? ` (${carrier})` : ""}`,
  );

  await sendOrderEmail(config, {
    type: "order_shipped",
    to: bundle.order.email,
    orderPublicId: bundle.order.publicId,
    totalCents: bundle.order.totalCents,
    currency: bundle.order.currency,
    carrier: carrier ?? undefined,
    trackingNumber: trackingNumber ?? undefined,
    locale: await resolveSiteEmailLocale(db, bundle.order.siteId),
  });

  return { ok: true as const, order: updated!, idempotent: false };
}

export async function issueCreditNote(
  db: Db,
  orderId: string,
  config: AppConfig,
) {
  const bundle = await loadOrderBundle(db, orderId);
  if (!bundle) return { ok: false as const, code: "NOT_FOUND" as const };
  if (
    bundle.order.status !== "paid" &&
    bundle.order.status !== "fulfilled"
  ) {
    return { ok: false as const, code: "INVALID_STATUS" as const };
  }
  if (!bundle.invoice) {
    return { ok: false as const, code: "NO_INVOICE" as const };
  }
  const existingCn = bundle.invoices.find((i) => i.kind === "credit_note");
  if (existingCn) {
    return {
      ok: true as const,
      order: bundle.order,
      invoice: existingCn,
      idempotent: true,
    };
  }

  const merchant = await getOrDefaultLegalProfile(db, bundle.order.organizationId);
  const now = new Date();

  const result = await db.transaction(async (tx) => {
    const number = await allocateInvoiceNumberInTx(
      tx,
      bundle.order.organizationId,
      merchant.creditNotePrefix ?? "AV",
    );
    const totalsJson = buildInvoiceTotalsJson({
      lines: toInvoiceLines(bundle.items),
      subtotalCents: bundle.order.subtotalCents,
      discountCents: bundle.order.discountCents ?? 0,
      shippingCents: bundle.order.shippingCents,
      taxCents: bundle.order.taxCents,
      totalCents: bundle.order.totalCents,
      currency: bundle.order.currency,
    });

    const [created] = await tx
      .insert(invoice)
      .values({
        organizationId: bundle.order.organizationId,
        siteId: bundle.order.siteId,
        orderId,
        parentInvoiceId: bundle.invoice!.id,
        number,
        kind: "credit_note",
        issuedAt: now,
        totalsJson,
        pdfReady: true,
      })
      .returning();

    const [updated] = await tx
      .update(storeOrder)
      .set({
        status: "refunded",
        updatedAt: now,
      })
      .where(eq(storeOrder.id, orderId))
      .returning();

    await tx.insert(orderEvent).values({
      orderId,
      type: "credit_note",
      message: `Credit note ${number} (fiscal only; no Stripe refund)`,
    });

    return { order: updated!, invoice: created! };
  });

  void config;
  return { ok: true as const, ...result, idempotent: false };
}

export async function cancelOrder(
  db: Db,
  orderId: string,
  config: AppConfig,
) {
  const bundle = await loadOrderBundle(db, orderId);
  if (!bundle) return { ok: false as const, code: "NOT_FOUND" as const };
  if (bundle.order.status !== "pending_payment") {
    return { ok: false as const, code: "INVALID_STATUS" as const };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(storeOrder)
      .set({
        status: "cancelled",
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(storeOrder.id, orderId));

    for (const item of bundle.items) {
      if (item.variantId) {
        const [variant] = await tx
          .select()
          .from(productVariant)
          .where(eq(productVariant.id, item.variantId))
          .limit(1);
        if (variant) {
          await tx
            .update(productVariant)
            .set({
              stock: variant.stock + item.quantity,
              updatedAt: now,
            })
            .where(eq(productVariant.id, item.variantId));
        }
      } else if (item.productId) {
        const [prod] = await tx
          .select()
          .from(product)
          .where(eq(product.id, item.productId))
          .limit(1);
        if (!prod) continue;
        await tx
          .update(product)
          .set({
            stock: prod.stock + item.quantity,
            updatedAt: now,
          })
          .where(eq(product.id, item.productId));
      }
    }

    await tx.insert(orderEvent).values({
      orderId,
      type: "cancel",
      message: "Order cancelled; stock restored",
    });
  });

  const productIds = [
    ...new Set(
      bundle.items
        .map((i) => i.productId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  for (const productId of productIds) {
    await syncProductStockFromVariants(db, productId);
  }

  await sendOrderEmail(config, {
    type: "order_cancelled",
    to: bundle.order.email,
    orderPublicId: bundle.order.publicId,
    locale: await resolveSiteEmailLocale(db, bundle.order.siteId),
  });

  const refreshed = await loadOrderBundle(db, orderId);
  return { ok: true as const, order: refreshed!.order };
}

export async function renderInvoicePdf(db: Db, orderId: string) {
  const bundle = await loadOrderBundle(db, orderId);
  if (!bundle?.invoice) return null;
  const input = await buildPdfInput(
    db,
    bundle.order,
    bundle.items,
    bundle.invoice.number,
    bundle.invoice.issuedAt,
    "invoice",
  );
  return {
    bytes: await buildInvoicePdf(input),
    number: bundle.invoice.number,
  };
}

export async function renderInvoiceHtml(db: Db, orderId: string) {
  const bundle = await loadOrderBundle(db, orderId);
  if (!bundle?.invoice) return null;
  const input = await buildPdfInput(
    db,
    bundle.order,
    bundle.items,
    bundle.invoice.number,
    bundle.invoice.issuedAt,
    "invoice",
  );
  return {
    html: buildInvoiceHtml(input),
    number: bundle.invoice.number,
  };
}

export async function renderDocumentPdf(db: Db, invoiceId: string) {
  const [inv] = await db
    .select()
    .from(invoice)
    .where(eq(invoice.id, invoiceId))
    .limit(1);
  if (!inv) return null;
  const bundle = await loadOrderBundle(db, inv.orderId);
  if (!bundle) return null;
  const input = await buildPdfInput(
    db,
    bundle.order,
    bundle.items,
    inv.number,
    inv.issuedAt,
    inv.kind,
  );
  return {
    bytes: await buildInvoicePdf(input),
    number: inv.number,
    kind: inv.kind,
  };
}

export async function renderDocumentHtml(db: Db, invoiceId: string) {
  const [inv] = await db
    .select()
    .from(invoice)
    .where(eq(invoice.id, invoiceId))
    .limit(1);
  if (!inv) return null;
  const bundle = await loadOrderBundle(db, inv.orderId);
  if (!bundle) return null;
  const input = await buildPdfInput(
    db,
    bundle.order,
    bundle.items,
    inv.number,
    inv.issuedAt,
    inv.kind,
  );
  return {
    html: buildInvoiceHtml(input),
    number: inv.number,
    kind: inv.kind,
  };
}

export async function exportAccountingCsv(
  db: Db,
  organizationId: string,
  from?: Date,
  to?: Date,
) {
  const conditions = [eq(invoice.organizationId, organizationId)];
  if (from) conditions.push(gte(invoice.issuedAt, from));
  if (to) conditions.push(lte(invoice.issuedAt, to));

  const rows = await db
    .select({
      invoice,
      order: storeOrder,
    })
    .from(invoice)
    .innerJoin(storeOrder, eq(invoice.orderId, storeOrder.id))
    .where(and(...conditions))
    .orderBy(desc(invoice.issuedAt));

  const journal = rows.flatMap((r) => {
    const base = {
      issuedAt: r.invoice.issuedAt,
      invoiceNumber: r.invoice.number,
      currency: r.order.currency,
      subtotalCents: r.order.subtotalCents,
      discountCents: r.order.discountCents ?? 0,
      shippingCents: r.order.shippingCents,
      taxCents: r.order.taxCents,
      totalCents: r.order.totalCents,
    };
    return r.invoice.kind === "credit_note"
      ? journalLinesForCreditNote(base)
      : journalLinesForPaidOrder(base);
  });
  return accountingRowsToCsv(journal);
}

export async function salesVatReport(
  db: Db,
  organizationId: string,
  from?: Date,
  to?: Date,
) {
  const conditions = [
    eq(storeOrder.organizationId, organizationId),
    sql`${storeOrder.status} in ('paid', 'fulfilled', 'refunded')`,
  ];
  if (from) conditions.push(gte(storeOrder.paidAt, from));
  if (to) conditions.push(lte(storeOrder.paidAt, to));

  const orders = await db
    .select()
    .from(storeOrder)
    .where(and(...conditions));

  let orderCount = 0;
  let grossSalesCents = 0;
  let discountCents = 0;
  let shippingCents = 0;
  let taxCents = 0;
  let netSalesCents = 0;

  for (const o of orders) {
    if (o.status === "refunded") continue;
    orderCount += 1;
    grossSalesCents += o.subtotalCents;
    discountCents += o.discountCents ?? 0;
    shippingCents += o.shippingCents;
    taxCents += o.taxCents;
    netSalesCents += o.totalCents;
  }

  return {
    orderCount,
    grossSalesCents,
    discountCents,
    shippingCents,
    taxCents,
    netSalesCents,
  };
}

export async function listLowStockProducts(db: Db, organizationId: string) {
  const products = await db
    .select()
    .from(product)
    .where(eq(product.organizationId, organizationId));

  return products
    .filter(
      (p) =>
        p.lowStockThreshold != null && p.stock <= p.lowStockThreshold,
    )
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold!,
      status: p.status,
    }));
}

export { addEvent };
