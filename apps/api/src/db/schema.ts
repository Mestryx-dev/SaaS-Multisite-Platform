import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
]);

export const siteStatusEnum = pgEnum("site_status", ["draft", "live", "archived"]);

export const domainVerificationEnum = pgEnum("domain_verification_status", [
  "pending",
  "verified",
  "failed",
]);

export const pageStatusEnum = pgEnum("page_status", ["draft", "published"]);

export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
]);

/** Better Auth — user */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Better Auth — session */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
});

/** Better Auth — account */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Better Auth — verification */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const organization = pgTable("organization", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  planId: text("plan_id").default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  modulesAllowed: jsonb("modules_allowed").$type<string[]>().notNull().default(["cms"]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const membership = pgTable(
  "membership",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("membership_org_user_uidx").on(t.organizationId, t.userId)],
);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const inviteRoleEnum = pgEnum("invite_role", [
  "admin",
  "editor",
  "viewer",
]);

/** Pending org staff invite (FB-035). Not storefront customers. */
export const organizationInvite = pgTable(
  "organization_invite",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: inviteRoleEnum("role").notNull().default("viewer"),
    token: text("token").notNull().unique(),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: inviteStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const site = pgTable(
  "site",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: siteStatusEnum("status").notNull().default("draft"),
    defaultLocale: text("default_locale").notNull().default("en"),
    themeJson: jsonb("theme_json").$type<Record<string, unknown>>(),
    seoDefaultTitle: text("seo_default_title"),
    seoDefaultDescription: text("seo_default_description"),
    ogImageUrl: text("og_image_url"),
    llmsIntro: text("llms_intro"),
    /** FB-076: show EU cookie consent banner on storefront */
    cookieConsentEnabled: boolean("cookie_consent_enabled").notNull().default(true),
    /** Path to privacy/cookie policy (default /privacy) */
    cookiePolicyPath: text("cookie_policy_path").notNull().default("/privacy"),
    /** FB-089: Umami website id for this storefront */
    umamiWebsiteId: text("umami_website_id"),
    /** FB-089: Umami script URL (defaults to platform UMAMI_SCRIPT_URL) */
    umamiSrc: text("umami_src"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("site_org_slug_uidx").on(t.organizationId, t.slug)],
);

/** Homepage / promo banners (FB-073). */
export const siteBanner = pgTable(
  "site_banner",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    imageUrl: text("image_url"),
    href: text("href"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("site_banner_site_sort_uidx").on(t.siteId, t.sortOrder, t.id)],
);

export const domain = pgTable(
  "domain",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    verificationStatus: domainVerificationEnum("verification_status")
      .notNull()
      .default("pending"),
    verificationToken: text("verification_token"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("domain_hostname_uidx").on(t.hostname)],
);

export const page = pgTable(
  "page",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    status: pageStatusEnum("status").notNull().default("draft"),
    bodyJson: jsonb("body_json").$type<Record<string, unknown>>().notNull().default({}),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImageUrl: text("og_image_url"),
    canonicalPath: text("canonical_path"),
    robots: text("robots").default("index,follow"),
    jsonLd: jsonb("json_ld").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("page_site_slug_uidx").on(t.siteId, t.slug)],
);

export const menuLocationEnum = pgEnum("menu_location", ["header", "footer"]);

/** Site navigation menu container (FB-088). */
export const siteMenu = pgTable(
  "site_menu",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    location: menuLocationEnum("location").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("site_menu_site_location_uidx").on(t.siteId, t.location)],
);

/** Menu link items. */
export const siteMenuItem = pgTable("site_menu_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => siteMenu.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  href: text("href").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plan = pgTable("plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  maxSites: integer("max_sites").notNull().default(1),
  modulesAllowed: jsonb("modules_allowed").$type<string[]>().notNull().default(["cms"]),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Stripe webhook idempotency */
export const webhookEvent = pgTable("webhook_event", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull().default("stripe"),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  payloadType: text("payload_type"),
});

export const schemaMeta = pgTable("schema_meta", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Commerce catalog — owned by organization.
 * `siteId` null = in catalog only (not on a storefront yet).
 * Set `siteId` to publish the product on that public site.
 */
export const product = pgTable(
  "product",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    siteId: uuid("site_id").references(() => site.id, { onDelete: "set null" }),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    compareAtCents: integer("compare_at_cents"),
    currency: text("currency").notNull().default("eur"),
    taxClass: text("tax_class").notNull().default("standard"),
    stock: integer("stock").notNull().default(0),
    /** null = no low-stock alert for this product */
    lowStockThreshold: integer("low_stock_threshold"),
    status: productStatusEnum("status").notNull().default("draft"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("product_org_slug_uidx").on(t.organizationId, t.slug),
    uniqueIndex("product_org_sku_uidx").on(t.organizationId, t.sku),
  ],
);

export const couponTypeEnum = pgEnum("coupon_type", ["percent", "fixed"]);

/** Org-scoped promo code (FB-065). */
export const coupon = pgTable(
  "coupon",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    type: couponTypeEnum("type").notNull(),
    /** percent: basis points (1000 = 10%); fixed: cents off merchandise */
    value: integer("value").notNull(),
    minSubtotalCents: integer("min_subtotal_cents"),
    maxRedemptions: integer("max_redemptions"),
    redemptionCount: integer("redemption_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("coupon_org_code_uidx").on(t.organizationId, t.code)],
);

/** Catalog category / collection (org-scoped; optional site publish). */
export const category = pgTable(
  "category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    siteId: uuid("site_id").references(() => site.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("category_org_slug_uidx").on(t.organizationId, t.slug)],
);

export const productCategory = pgTable(
  "product_category",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("product_category_uidx").on(t.productId, t.categoryId)],
);

/** SKU-level variant (size/color). When absent, product.priceCents/stock are used. */
export const productVariant = pgTable(
  "product_variant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    optionsJson: jsonb("options_json")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    priceCents: integer("price_cents").notNull(),
    stock: integer("stock").notNull().default(0),
    status: productStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("product_variant_sku_uidx").on(t.productId, t.sku)],
);

/**
 * Storefront buyer profile (per site). Linked to Better Auth user when logged in.
 * Not an org membership — SaaS staff stay on membership table.
 */
export const customer = pgTable(
  "customer",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("customer_site_email_uidx").on(t.siteId, t.email),
    uniqueIndex("customer_site_user_uidx").on(t.siteId, t.userId),
  ],
);

/** Saved shipping address for a storefront customer (FB-078). */
export const customerAddress = pgTable("customer_address", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => site.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Home"),
  name: text("name").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("FR"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cart = pgTable(
  "cart",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull(),
    customerId: uuid("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    currency: text("currency").notNull().default("eur"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    /** FB-081: set when abandoned-cart email was sent */
    abandonedEmailSentAt: timestamp("abandoned_email_sent_at", {
      withTimezone: true,
    }),
  },
  (t) => [uniqueIndex("cart_site_session_uidx").on(t.siteId, t.sessionToken)],
);

export const cartItem = pgTable(
  "cart_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariant.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cart_item_cart_variant_uidx").on(t.cartId, t.variantId)],
);

export const wishlistItem = pgTable(
  "wishlist_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull(),
    customerId: uuid("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("wishlist_site_session_product_uidx").on(
      t.siteId,
      t.sessionToken,
      t.productId,
    ),
  ],
);

export const storeOrder = pgTable(
  "store_order",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicId: text("public_id").notNull().unique(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customer.id, {
      onDelete: "set null",
    }),
    email: text("email").notNull(),
    status: orderStatusEnum("status").notNull().default("pending_payment"),
    currency: text("currency").notNull().default("eur"),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    couponId: uuid("coupon_id").references(() => coupon.id, {
      onDelete: "set null",
    }),
    couponCode: text("coupon_code"),
    shippingMethodId: uuid("shipping_method_id"),
    shippingAddressJson: jsonb("shipping_address_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    billingAddressJson: jsonb("billing_address_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

/** Tenant shipping zone (countries covered). */
export const shippingZone = pgTable("shipping_zone", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => site.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  countriesJson: jsonb("countries_json")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Rate within a zone. */
export const shippingMethod = pgTable("shipping_method", {
  id: uuid("id").defaultRandom().primaryKey(),
  zoneId: uuid("zone_id")
    .notNull()
    .references(() => shippingZone.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull().default(0),
  currency: text("currency").notNull().default("eur"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storeOrderItem = pgTable("store_order_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => storeOrder.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => product.id, { onDelete: "set null" }),
  variantId: uuid("variant_id").references(() => productVariant.id, {
    onDelete: "set null",
  }),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  taxClass: text("tax_class").notNull().default("standard"),
});

export const orderEvent = pgTable("order_event", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => storeOrder.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const merchantLegalProfile = pgTable(
  "merchant_legal_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    legalName: text("legal_name").notNull(),
    siret: text("siret"),
    vatNumber: text("vat_number"),
    addressJson: jsonb("address_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    invoicePrefix: text("invoice_prefix").notNull().default("INV"),
    creditNotePrefix: text("credit_note_prefix").notNull().default("AV"),
    rcs: text("rcs"),
    capital: text("capital"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("merchant_legal_org_uidx").on(t.organizationId)],
);

export const invoiceKindEnum = pgEnum("invoice_kind", ["invoice", "credit_note"]);

export const invoice = pgTable(
  "invoice",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    siteId: uuid("site_id")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => storeOrder.id, { onDelete: "cascade" }),
    /** Credit note → original sales invoice */
    parentInvoiceId: uuid("parent_invoice_id"),
    number: text("number").notNull(),
    kind: invoiceKindEnum("kind").notNull().default("invoice"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    totalsJson: jsonb("totals_json")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    pdfReady: boolean("pdf_ready").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invoice_org_number_uidx").on(t.organizationId, t.number),
  ],
);

/** Uploaded or registered media asset (R2/S3 or external URL). */
export const mediaAsset = pgTable("media_asset", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  siteId: uuid("site_id").references(() => site.id, { onDelete: "set null" }),
  key: text("key").notNull(),
  url: text("url").notNull(),
  contentType: text("content_type"),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Product gallery (cover remains product.imageUrl). */
export const productMedia = pgTable(
  "product_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => mediaAsset.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    alt: text("alt"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("product_media_product_asset_uidx").on(t.productId, t.assetId)],
);

export const returnRequestStatusEnum = pgEnum("return_request_status", [
  "requested",
  "approved",
  "rejected",
  "cancelled",
]);

/** FB-082 — customer return / RMA request (no Stripe refund in MVP). */
export const returnRequest = pgTable("return_request", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  siteId: uuid("site_id")
    .notNull()
    .references(() => site.id, { onDelete: "cascade" }),
  orderId: uuid("order_id")
    .notNull()
    .references(() => storeOrder.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: returnRequestStatusEnum("status").notNull().default("requested"),
  itemsJson: jsonb("items_json")
    .$type<Record<string, unknown>[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
