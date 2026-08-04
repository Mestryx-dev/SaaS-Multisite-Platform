import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import {
  cart,
  cartItem,
  customer,
  site,
  wishlistItem,
} from "../../db/schema.js";

export type AuthUserLite = {
  id: string;
  email: string;
  name?: string | null;
};

export async function ensureStorefrontCustomer(
  db: Db,
  input: { siteId: string; user: AuthUserLite },
) {
  const [siteRow] = await db
    .select()
    .from(site)
    .where(eq(site.id, input.siteId))
    .limit(1);
  if (!siteRow) return null;

  const email = input.user.email.toLowerCase().trim();
  const name = input.user.name?.trim() || null;

  const [byUser] = await db
    .select()
    .from(customer)
    .where(
      and(eq(customer.siteId, input.siteId), eq(customer.userId, input.user.id)),
    )
    .limit(1);
  if (byUser) {
    if (name && name !== byUser.name) {
      const [updated] = await db
        .update(customer)
        .set({ name, email, updatedAt: new Date() })
        .where(eq(customer.id, byUser.id))
        .returning();
      return updated!;
    }
    return byUser;
  }

  const [byEmail] = await db
    .select()
    .from(customer)
    .where(and(eq(customer.siteId, input.siteId), eq(customer.email, email)))
    .limit(1);
  if (byEmail) {
    const [updated] = await db
      .update(customer)
      .set({
        userId: input.user.id,
        name: name ?? byEmail.name,
        updatedAt: new Date(),
      })
      .where(eq(customer.id, byEmail.id))
      .returning();
    return updated!;
  }

  const [created] = await db
    .insert(customer)
    .values({
      organizationId: siteRow.organizationId,
      siteId: siteRow.id,
      userId: input.user.id,
      email,
      name,
    })
    .returning();
  return created!;
}

/**
 * Attach guest cart/wishlist (session cookie) to customer and merge into
 * any existing customer-owned cart.
 */
export async function mergeGuestCartIntoCustomer(
  db: Db,
  input: { siteId: string; sessionToken: string; customerId: string },
) {
  const [guestCart] = await db
    .select()
    .from(cart)
    .where(
      and(
        eq(cart.siteId, input.siteId),
        eq(cart.sessionToken, input.sessionToken),
      ),
    )
    .limit(1);

  let [customerCart] = await db
    .select()
    .from(cart)
    .where(
      and(eq(cart.siteId, input.siteId), eq(cart.customerId, input.customerId)),
    )
    .limit(1);

  if (!customerCart && guestCart) {
    const [updated] = await db
      .update(cart)
      .set({ customerId: input.customerId, updatedAt: new Date() })
      .where(eq(cart.id, guestCart.id))
      .returning();
    customerCart = updated!;
  } else if (!customerCart) {
    const [created] = await db
      .insert(cart)
      .values({
        siteId: input.siteId,
        sessionToken: `cust_${input.customerId}`,
        customerId: input.customerId,
      })
      .returning();
    customerCart = created!;
  } else if (guestCart && guestCart.id !== customerCart.id) {
    const guestItems = await db
      .select()
      .from(cartItem)
      .where(eq(cartItem.cartId, guestCart.id));
    for (const item of guestItems) {
      const [existing] = await db
        .select()
        .from(cartItem)
        .where(
          and(
            eq(cartItem.cartId, customerCart.id),
            eq(cartItem.variantId, item.variantId),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .update(cartItem)
          .set({ quantity: existing.quantity + item.quantity })
          .where(eq(cartItem.id, existing.id));
      } else {
        await db.insert(cartItem).values({
          cartId: customerCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        });
      }
    }
    await db.delete(cartItem).where(eq(cartItem.cartId, guestCart.id));
    await db.delete(cart).where(eq(cart.id, guestCart.id));
  }

  const guestWish = await db
    .select()
    .from(wishlistItem)
    .where(
      and(
        eq(wishlistItem.siteId, input.siteId),
        eq(wishlistItem.sessionToken, input.sessionToken),
        isNull(wishlistItem.customerId),
      ),
    );
  for (const w of guestWish) {
    const [existing] = await db
      .select()
      .from(wishlistItem)
      .where(
        and(
          eq(wishlistItem.siteId, input.siteId),
          eq(wishlistItem.customerId, input.customerId),
          eq(wishlistItem.productId, w.productId),
        ),
      )
      .limit(1);
    if (existing) {
      await db.delete(wishlistItem).where(eq(wishlistItem.id, w.id));
    } else {
      await db
        .update(wishlistItem)
        .set({ customerId: input.customerId })
        .where(eq(wishlistItem.id, w.id));
    }
  }

  return customerCart!;
}

export async function getOrCreateCartForSession(
  db: Db,
  siteId: string,
  sessionToken: string,
  customerId?: string | null,
) {
  if (customerId) {
    return mergeGuestCartIntoCustomer(db, {
      siteId,
      sessionToken,
      customerId,
    });
  }
  const [existing] = await db
    .select()
    .from(cart)
    .where(and(eq(cart.siteId, siteId), eq(cart.sessionToken, sessionToken)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(cart)
    .values({ siteId, sessionToken })
    .returning();
  return created!;
}
