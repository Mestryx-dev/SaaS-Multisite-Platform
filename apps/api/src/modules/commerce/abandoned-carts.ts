import { and, eq, isNull, lt, sql } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import { cart, cartItem, customer, site } from "../../db/schema.js";
import type { AppConfig } from "../../lib/config.js";
import { normalizeEmailLocale, type EmailLocale } from "../email/i18n.js";
import { sendAbandonedCartEmail } from "../email/send.js";

export type AbandonedCartRow = {
  cartId: string;
  siteId: string;
  organizationId: string;
  email: string;
  customerName: string | null;
  updatedAt: Date;
  itemCount: number;
  locale: EmailLocale;
};

export async function findAbandonedCarts(
  db: Db,
  opts: {
    organizationId: string;
    olderThanHours?: number;
    limit?: number;
  },
): Promise<AbandonedCartRow[]> {
  const olderThanHours = opts.olderThanHours ?? 24;
  const limit = opts.limit ?? 50;
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

  const rows = await db
    .select({
      cartId: cart.id,
      siteId: cart.siteId,
      organizationId: site.organizationId,
      email: customer.email,
      customerName: customer.name,
      updatedAt: cart.updatedAt,
      defaultLocale: site.defaultLocale,
      itemCount: sql<number>`count(${cartItem.id})::int`,
    })
    .from(cart)
    .innerJoin(site, eq(cart.siteId, site.id))
    .innerJoin(customer, eq(cart.customerId, customer.id))
    .innerJoin(cartItem, eq(cartItem.cartId, cart.id))
    .where(
      and(
        eq(site.organizationId, opts.organizationId),
        lt(cart.updatedAt, cutoff),
        isNull(cart.abandonedEmailSentAt),
      ),
    )
    .groupBy(
      cart.id,
      cart.siteId,
      site.organizationId,
      site.defaultLocale,
      customer.email,
      customer.name,
      cart.updatedAt,
    )
    .having(sql`count(${cartItem.id}) > 0`)
    .limit(limit);

  return rows.map((r) => ({
    cartId: r.cartId,
    siteId: r.siteId,
    organizationId: r.organizationId,
    email: r.email,
    customerName: r.customerName,
    updatedAt: r.updatedAt,
    itemCount: Number(r.itemCount),
    locale: normalizeEmailLocale(r.defaultLocale),
  }));
}

export async function runAbandonedCartEmails(
  db: Db,
  config: AppConfig,
  organizationId: string,
  olderThanHours = 24,
): Promise<{ sent: number; candidates: AbandonedCartRow[] }> {
  const candidates = await findAbandonedCarts(db, {
    organizationId,
    olderThanHours,
  });
  let sent = 0;
  for (const row of candidates) {
    const result = await sendAbandonedCartEmail(config, {
      to: row.email,
      customerName: row.customerName,
      cartId: row.cartId,
      itemCount: row.itemCount,
      locale: row.locale,
    });
    if (result.ok) {
      await db
        .update(cart)
        .set({ abandonedEmailSentAt: new Date() })
        .where(eq(cart.id, row.cartId));
      sent += 1;
    }
  }
  return { sent, candidates };
}
