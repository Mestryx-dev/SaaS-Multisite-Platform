import {
  Button,
  ButtonLink,
  CartDrawer,
  CartLine,
  CategoryNav,
  CheckoutLayout,
  CheckoutSteps,
  CollectionCard,
  CollectionGrid,
  EmptyState,
  Flash,
  Input,
  Label,
  Muted,
  OrderSummary,
  PdpLayout,
  PlpToolbar,
  PriceDisplay,
  PriceRangeInputs,
  ProductCard,
  ProductGallery,
  ProductGrid,
  Select,
  Stack,
  StoreForm,
  StoreFooter,
  StoreHeader,
  StoreHero,
  PromoBanners,
  StoreMain,
  StoreSection,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  TrustStrip,
} from "@mestryx/ui";
import type { ReactNode } from "react";
import { BlockRenderer, normalizeBlocks, type CmsBlock } from "./blocks.js";
import { t, type Locale } from "./i18n/index.js";
import { formatMoney, type StoreProduct } from "./storefront.js";

export type NavItem = { label: string; href: string };

export type OrderEventItem = {
  type: string;
  message: string;
  createdAt: string;
};

export function orderStatusLabel(locale: Locale, status: string): string {
  const key = `store.order.status.${status}`;
  const labeled = t(locale, key);
  return labeled === key ? status : labeled;
}

export function returnStatusLabel(locale: Locale, status: string): string {
  const key = `store.return.status.${status}`;
  const labeled = t(locale, key);
  return labeled === key ? status : labeled;
}

/** Best-effort carrier tracking URL from carrier name + tracking number. */
export function carrierTrackingUrl(
  carrier?: string | null,
  trackingNumber?: string | null,
): string | null {
  if (!trackingNumber) return null;
  const c = (carrier ?? "").toLowerCase();
  const n = encodeURIComponent(trackingNumber);
  if (c.includes("colissimo") || c.includes("laposte") || c.includes("la poste")) {
    return `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`;
  }
  if (c.includes("chronopost")) {
    return `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${n}`;
  }
  if (c.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${n}`;
  }
  if (c.includes("dhl")) {
    return `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${n}`;
  }
  if (c.includes("mondial")) {
    return `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${n}`;
  }
  return null;
}

function trustItems(locale: Locale) {
  return [
    {
      title: t(locale, "store.trust.shipping"),
      description: t(locale, "store.trust.shippingHint"),
    },
    {
      title: t(locale, "store.trust.returns"),
      description: t(locale, "store.trust.returnsHint"),
    },
    {
      title: t(locale, "store.trust.secure"),
      description: t(locale, "store.trust.secureHint"),
    },
  ];
}

function defaultFooterColumns(locale: Locale) {
  return [
    {
      title: t(locale, "store.footer.shop"),
      items: [{ label: t(locale, "store.footer.allProducts"), href: "/" }],
    },
    {
      title: t(locale, "store.footer.help"),
      items: [
        { label: t(locale, "store.footer.trackOrder"), href: "/orders/track" },
      ],
    },
    {
      title: t(locale, "store.footer.legal"),
      items: [
        { label: t(locale, "store.footer.privacy"), href: "/privacy" },
        { label: t(locale, "store.footer.terms"), href: "/terms" },
        { label: t(locale, "store.footer.legalNotice"), href: "/legal" },
      ],
    },
  ];
}

function TrackingLink(props: {
  locale: Locale;
  carrier?: string | null;
  trackingNumber?: string | null;
}) {
  const url = carrierTrackingUrl(props.carrier, props.trackingNumber);
  if (!props.trackingNumber && !props.carrier) return null;
  return (
    <Muted>
      {t(props.locale, "store.order.shippingLine", {
        carrier: props.carrier ?? "carrier",
      })}
      {props.trackingNumber
        ? ` · ${t(props.locale, "store.order.tracking", { number: props.trackingNumber })}`
        : ""}
      {url ? (
        <>
          {" · "}
          <a href={url} rel="noopener noreferrer" target="_blank">
            {t(props.locale, "store.order.trackCarrier")}
          </a>
        </>
      ) : null}
    </Muted>
  );
}

function OrderTimeline(props: {
  locale: Locale;
  events?: OrderEventItem[];
}) {
  if (!props.events?.length) return null;
  return (
    <>
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        {t(props.locale, "store.order.timeline")}
      </h2>
      <ol className="ui-order-timeline">
        {props.events.map((ev, i) => (
          <li key={`${ev.type}-${ev.createdAt}-${i}`}>
            <strong>{ev.message}</strong>
            <br />
            <time dateTime={ev.createdAt}>
              {new Date(ev.createdAt).toLocaleString(
                props.locale === "fr" ? "fr-FR" : "en-US",
              )}
            </time>
          </li>
        ))}
      </ol>
    </>
  );
}

function productCardProps(p: StoreProduct, locale: Locale) {
  const onSale =
    p.compareAtCents != null && p.compareAtCents > p.priceCents;
  return {
    name: p.name,
    slug: p.slug,
    priceLabel: formatMoney(p.priceCents, p.currency),
    compareAtLabel: onSale
      ? formatMoney(p.compareAtCents!, p.currency)
      : null,
    badge: onSale ? t(locale, "store.pdp.sale") : null,
    imageUrl: p.imageUrl,
  };
}

function Shell({
  locale,
  siteName,
  siteId,
  cartCount,
  accountHref,
  accountLabel,
  searchQuery,
  headerNav,
  footerNav,
  children,
}: {
  locale: Locale;
  siteName: string;
  siteId?: string;
  cartCount?: number;
  accountHref?: string;
  accountLabel?: string;
  searchQuery?: string | null;
  headerNav?: NavItem[];
  footerNav?: NavItem[];
  children: ReactNode;
}) {
  const resolvedAccount =
    accountLabel ?? t(locale, "store.nav.signIn");
  const footerColumns =
    footerNav && footerNav.length > 0
      ? [
          {
            title: t(locale, "store.footer.help"),
            items: footerNav,
          },
        ]
      : defaultFooterColumns(locale);
  return (
    <>
      <StoreHeader
        brand={siteName}
        siteId={siteId}
        cartCount={cartCount ?? 0}
        accountHref={accountHref}
        accountLabel={resolvedAccount}
        cartLabel={t(locale, "store.nav.cart")}
        wishlistLabel={t(locale, "store.nav.wishlist")}
        searchPlaceholder={t(locale, "store.nav.search")}
        searchButtonLabel={t(locale, "store.nav.searchButton")}
        searchQuery={searchQuery}
        navItems={headerNav}
        menuToggleLabel={t(locale, "store.nav.menuToggle")}
        navAriaLabel={t(locale, "store.nav.primary")}
        menuLabel={t(locale, "store.nav.menu")}
        shopLabel={t(locale, "store.nav.shop")}
        themeDarkLabel={t(locale, "store.nav.themeDark")}
        themeLightLabel={t(locale, "store.nav.themeLight")}
        themeTitle={t(locale, "store.nav.theme")}
      />
      {children}
      <StoreFooter brand={siteName} columns={footerColumns} />
      {siteId && siteId !== "local" ? (
        <CartDrawer
          siteId={siteId}
          title={t(locale, "store.cart.title")}
          loadingLabel={t(locale, "store.cart.loading")}
          viewCartLabel={t(locale, "store.cart.view")}
          checkoutLabel={t(locale, "store.cart.checkout")}
          closeLabel={t(locale, "store.cart.close")}
        />
      ) : null}
    </>
  );
}

export function HomePage(props: {
  locale: Locale;
  siteId?: string;
  siteName: string;
  description: string;
  products: StoreProduct[];
  categories: Array<{ name: string; slug: string }>;
  categoryQ: string | null;
  searchQ: string | null;
  minPriceQ: string | null;
  maxPriceQ: string | null;
  sortQ: string | null;
  cartCount?: number;
  banners: Array<{
    id: string;
    title: string;
    subtitle?: string | null;
    imageUrl?: string | null;
    href?: string | null;
  }>;
  headerNav?: NavItem[];
  footerNav?: NavItem[];
}) {
  const isCatalog = Boolean(
    props.categoryQ ||
      props.searchQ ||
      props.minPriceQ ||
      props.maxPriceQ ||
      (props.sortQ && props.sortQ !== "newest"),
  );

  const heroImage =
    props.banners.find((b) => b.imageUrl)?.imageUrl ??
    props.products.find((p) => p.imageUrl)?.imageUrl ??
    null;

  const featured = props.products.slice(0, 8);
  const activeCategory = props.categories.find(
    (c) => c.slug === props.categoryQ,
  );

  const collectionImage = (_slug: string, _name: string, index: number) => {
    const withImages = props.products.filter((p) => p.imageUrl);
    if (withImages.length === 0) return null;
    return withImages[index % withImages.length]!.imageUrl ?? null;
  };

  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
      searchQuery={props.searchQ}
      headerNav={props.headerNav}
      footerNav={props.footerNav}
    >
      {!isCatalog ? (
        <>
          <StoreHero
            variant="vitrine"
            title={props.siteName}
            description={props.description}
            imageUrl={heroImage}
            actions={
              <ButtonLink
                href="/#featured"
                className="bg-[var(--primary-foreground)] text-[var(--foreground)] hover:opacity-90"
              >
                {t(locale, "store.plp.discover")}
              </ButtonLink>
            }
          />
          <StoreMain className="ui-store-main--vitrine">
            {props.banners.length > 0 ? (
              <PromoBanners banners={props.banners} />
            ) : null}
            {props.categories.length > 0 ? (
              <StoreSection
                title={t(locale, "store.plp.collections")}
                description={t(locale, "store.plp.collectionsHint")}
              >
                <CollectionGrid>
                  {props.categories.map((cat, i) => (
                    <CollectionCard
                      key={cat.slug}
                      name={cat.name}
                      slug={cat.slug}
                      imageUrl={collectionImage(cat.slug, cat.name, i)}
                    />
                  ))}
                </CollectionGrid>
              </StoreSection>
            ) : null}
            <StoreSection
              title={t(locale, "store.plp.selected")}
              description={t(locale, "store.plp.selectedHint")}
              action={
                props.categories[0] ? (
                  <ButtonLink
                    href={`/?category=${encodeURIComponent(props.categories[0].slug)}`}
                    variant="ghost"
                    size="sm"
                  >
                    {t(locale, "store.plp.shopAll")}
                  </ButtonLink>
                ) : null
              }
            >
              <div id="featured">
                {featured.length > 0 ? (
                  <ProductGrid featured>
                    {featured.map((p) => (
                      <ProductCard key={p.id} {...productCardProps(p, locale)} />
                    ))}
                  </ProductGrid>
                ) : (
                  <EmptyState>
                    {t(locale, "store.plp.featuredEmpty")}
                  </EmptyState>
                )}
              </div>
            </StoreSection>
            <TrustStrip
              items={trustItems(locale)}
              ariaLabel={t(locale, "store.trust.aria")}
            />
          </StoreMain>
        </>
      ) : (
        <StoreMain>
          <h1 className="ui-page-title">
            {props.searchQ
              ? t(locale, "store.plp.searchTitle", { query: props.searchQ })
              : (activeCategory?.name ?? t(locale, "store.plp.shop"))}
          </h1>
          <Muted className="mb-6">
            {t(
              locale,
              props.products.length === 1
                ? "store.plp.piece"
                : "store.plp.pieces",
              { count: props.products.length },
            )}
            {" · "}
            <a href="/">{t(locale, "store.common.backToShop")}</a>
          </Muted>
          {props.categories.length > 0 ? (
            <CategoryNav
              items={props.categories}
              activeSlug={props.categoryQ}
              allLabel={t(locale, "store.plp.all")}
              ariaLabel={t(locale, "store.plp.collectionsNav")}
            />
          ) : null}
          <StoreForm method="get" action="/" className="ui-store-form--plp">
            {props.categoryQ ? (
              <input type="hidden" name="category" value={props.categoryQ} />
            ) : null}
            {props.searchQ ? (
              <input type="hidden" name="q" value={props.searchQ} />
            ) : null}
            <PlpToolbar>
              <PriceRangeInputs
                minDefault={props.minPriceQ}
                maxDefault={props.maxPriceQ}
                priceLabel={t(locale, "store.plp.price")}
                minPlaceholder={t(locale, "store.plp.priceMin")}
                maxPlaceholder={t(locale, "store.plp.priceMax")}
                minAriaLabel={t(locale, "store.plp.priceMinAria")}
                maxAriaLabel={t(locale, "store.plp.priceMaxAria")}
              />
              <div className="ui-plp-toolbar-sort">
                <label className="ui-plp-toolbar-sort-label" htmlFor="sort">
                  {t(locale, "store.plp.sort")}
                </label>
                <Select
                  id="sort"
                  name="sort"
                  defaultValue={props.sortQ ?? "newest"}
                  className="h-9 w-auto min-w-[11rem] shadow-none"
                >
                  <option value="newest">{t(locale, "store.plp.sortNewest")}</option>
                  <option value="price_asc">{t(locale, "store.plp.sortPriceAsc")}</option>
                  <option value="price_desc">{t(locale, "store.plp.sortPriceDesc")}</option>
                </Select>
              </div>
              <Button type="submit" variant="secondary" size="sm">
                {t(locale, "store.plp.apply")}
              </Button>
            </PlpToolbar>
          </StoreForm>
          {props.products.length > 0 ? (
            <ProductGrid>
              {props.products.map((p) => (
                <ProductCard key={p.id} {...productCardProps(p, locale)} />
              ))}
            </ProductGrid>
          ) : (
            <EmptyState>
              {props.searchQ
                ? t(locale, "store.plp.noSearch")
                : t(locale, "store.plp.noCollection")}
            </EmptyState>
          )}
        </StoreMain>
      )}
    </Shell>
  );
}

export type VariantOption = {
  id: string;
  sku: string;
  optionsJson: Record<string, string>;
  priceCents: number;
  stock: number;
  status: string;
};

export function ProductPage(props: {
  locale: Locale;
  siteId: string;
  siteName: string;
  cartCount?: number;
  product: StoreProduct;
  variants: VariantOption[];
  media?: Array<{ id: string; url: string; alt: string | null }>;
  added?: boolean;
  wish?: boolean;
}) {
  const { product: p, variants } = props;
  const stock = variants.reduce((s, v) => s + v.stock, 0) || p.stock;
  const galleryImages =
    props.media && props.media.length > 0
      ? props.media.map((img) => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
        }))
      : p.imageUrl
        ? [{ id: "cover", url: p.imageUrl, alt: p.name }]
        : [];
  const onSale =
    p.compareAtCents != null && p.compareAtCents > p.priceCents;

  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
    >
      <StoreMain>
        {props.added ? <Flash>{t(locale, "store.pdp.added")}</Flash> : null}
        {props.wish ? <Flash>{t(locale, "store.pdp.wishSaved")}</Flash> : null}
        <PdpLayout
          media={
            <ProductGallery images={galleryImages} productName={p.name} />
          }
        >
          <Stack gap="md">
            <h1 className="ui-text ui-text-display">{p.name}</h1>
            <PriceDisplay
              priceLabel={formatMoney(p.priceCents, p.currency)}
              compareAtLabel={
                onSale ? formatMoney(p.compareAtCents!, p.currency) : null
              }
              badge={onSale ? t(locale, "store.pdp.sale") : null}
            />
            <Muted>{p.description ?? ""}</Muted>
            <Muted>
              {stock > 0
                ? t(locale, "store.pdp.inStock", { count: stock })
                : t(locale, "store.pdp.outOfStock")}
            </Muted>
            <TrustStrip
              items={trustItems(locale)}
              ariaLabel={t(locale, "store.trust.aria")}
            />
            <form method="post" action="/actions/add-to-cart">
              <input type="hidden" name="siteId" value={props.siteId} />
              <input type="hidden" name="productId" value={p.id} />
              <input type="hidden" name="slug" value={p.slug} />
              {variants.length > 1 ? (
                <div>
                  <Label htmlFor="variantId">{t(locale, "store.pdp.option")}</Label>
                  <Select id="variantId" name="variantId">
                    {variants.map((v) => {
                      const label =
                        Object.entries(v.optionsJson ?? {}).length > 0
                          ? Object.entries(v.optionsJson)
                              .map(([k, val]) => `${k}: ${val}`)
                              .join(", ")
                          : t(locale, "store.pdp.defaultVariant");
                      return (
                        <option key={v.id} value={v.id}>
                          {label} — {formatMoney(v.priceCents, p.currency)}
                          {v.stock > 0
                            ? ` (${t(locale, "store.pdp.stockLeft", { count: v.stock })})`
                            : ` (${t(locale, "store.pdp.outOfStock")})`}
                        </option>
                      );
                    })}
                  </Select>
                </div>
              ) : variants[0] ? (
                <input type="hidden" name="variantId" value={variants[0].id} />
              ) : null}
              <div>
                <Label htmlFor="quantity">{t(locale, "store.pdp.quantity")}</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={1}
                  max={Math.max(stock, 1)}
                  defaultValue={1}
                  className="w-24"
                />
              </div>
              <Button type="submit" disabled={stock < 1}>
                {t(locale, "store.pdp.addToCart")}
              </Button>
            </form>
            <form method="post" action="/actions/add-wishlist">
              <input type="hidden" name="siteId" value={props.siteId} />
              <input type="hidden" name="productId" value={p.id} />
              <input type="hidden" name="slug" value={p.slug} />
              <Button type="submit" variant="ghost">
                {t(locale, "store.pdp.wishlist")}
              </Button>
            </form>
          </Stack>
        </PdpLayout>
      </StoreMain>
    </Shell>
  );
}

export function CartPage(props: {
  locale: Locale;
  siteId: string;
  siteName: string;
  cartCount?: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    currency: string;
    slug: string;
    imageUrl?: string | null;
  }>;
  subtotalCents: number;
}) {
  const currency = props.items[0]?.currency ?? "eur";
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
    >
      <StoreMain>
        <h1 className="ui-page-title">{t(locale, "store.cart.heading")}</h1>
        {props.items.length === 0 ? (
          <EmptyState>
            {t(locale, "store.cart.empty")}{" "}
            <a href="/">{t(locale, "store.cart.emptyCta")}</a>
          </EmptyState>
        ) : (
          <CheckoutLayout
            summary={
              <OrderSummary
                lines={props.items.map((i) => ({
                  label: `${i.name} × ${i.quantity}`,
                  value: formatMoney(
                    i.unitPriceCents * i.quantity,
                    i.currency,
                  ),
                }))}
                totalLabel={t(locale, "store.checkout.subtotal")}
                totalValue={formatMoney(props.subtotalCents, currency)}
              >
                <ButtonLink href="/checkout">
                  {t(locale, "store.cart.checkout")}
                </ButtonLink>
                <ButtonLink href="/" variant="ghost">
                  {t(locale, "store.common.continueShopping")}
                </ButtonLink>
              </OrderSummary>
            }
          >
            <div className="space-y-4">
              {props.items.map((i) => (
                <CartLine
                  key={i.id}
                  itemId={i.id}
                  siteId={props.siteId}
                  name={i.name}
                  href={`/p/${i.slug}`}
                  imageUrl={i.imageUrl}
                  quantity={i.quantity}
                  lineTotalLabel={formatMoney(
                    i.unitPriceCents * i.quantity,
                    i.currency,
                  )}
                  quantityLabel={t(locale, "store.cart.quantity")}
                  updateLabel={t(locale, "store.cart.update")}
                  removeLabel={t(locale, "store.cart.remove")}
                />
              ))}
            </div>
          </CheckoutLayout>
        )}
      </StoreMain>
    </Shell>
  );
}

export function WishlistPage(props: {
  locale: Locale;
  siteId: string;
  siteName: string;
  cartCount?: number;
  items: Array<{
    productId: string;
    name: string;
    slug: string;
    priceCents: number;
    currency: string;
  }>;
  flash?: "removed" | "cart" | null;
}) {
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
    >
      <StoreMain>
        <h1 className="ui-page-title">{t(locale, "store.wishlist.heading")}</h1>
        {props.flash === "removed" ? (
          <Flash>{t(locale, "store.wishlist.removed")}</Flash>
        ) : null}
        {props.flash === "cart" ? (
          <Flash>{t(locale, "store.pdp.added")}</Flash>
        ) : null}
        {props.items.length === 0 ? (
          <EmptyState>{t(locale, "store.wishlist.empty")}</EmptyState>
        ) : (
          <div className="ui-wishlist-grid">
            {props.items.map((i) => (
              <div key={i.productId} className="ui-wishlist-item">
                <ProductCard
                  name={i.name}
                  slug={i.slug}
                  priceLabel={formatMoney(i.priceCents, i.currency)}
                />
                <Stack gap="sm">
                  <form method="post" action="/actions/wishlist-to-cart">
                    <input type="hidden" name="siteId" value={props.siteId} />
                    <input type="hidden" name="productId" value={i.productId} />
                    <Button type="submit">{t(locale, "store.pdp.addToCart")}</Button>
                  </form>
                  <form method="post" action="/actions/remove-wishlist">
                    <input type="hidden" name="siteId" value={props.siteId} />
                    <input type="hidden" name="productId" value={i.productId} />
                    <Button type="submit" variant="ghost">
                      {t(locale, "store.wishlist.remove")}
                    </Button>
                  </form>
                </Stack>
              </div>
            ))}
          </div>
        )}
      </StoreMain>
    </Shell>
  );
}

export type SavedAddress = {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type CartSummaryItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  slug: string;
};

export function CheckoutPage(props: {
  locale: Locale;
  siteId: string;
  siteName: string;
  cartCount?: number;
  cartItems: CartSummaryItem[];
  subtotalCents: number;
  shippingMethods: Array<{
    id: string;
    name: string;
    priceCents: number;
    currency: string;
  }>;
  addresses?: SavedAddress[];
  emailPrefill?: string;
  signedIn?: boolean;
  error?: boolean;
}) {
  const defaultAddress =
    props.addresses?.find((a) => a.isDefault) ?? props.addresses?.[0];
  const currency = props.cartItems[0]?.currency ?? "eur";
  const { locale } = props;
  const checkoutForm = (
    <>
      <h1 className="ui-page-title">{t(locale, "store.checkout.heading")}</h1>
      <CheckoutSteps
        steps={[
          t(locale, "store.checkout.stepAddress"),
          t(locale, "store.checkout.stepShipping"),
          t(locale, "store.checkout.stepReview"),
        ]}
        current={2}
      />
      {props.error ? (
        <Flash>{t(locale, "store.checkout.error")}</Flash>
      ) : null}
      <Muted>{t(locale, "store.checkout.paymentPending")}</Muted>
      {!props.signedIn ? (
        <Muted>
          <a href="/account/sign-in">
            {t(locale, "store.checkout.signInHintBefore")}
          </a>{" "}
          {t(locale, "store.checkout.signInHintAfter")}
        </Muted>
      ) : null}
      <StoreForm method="post" action="/actions/checkout">
        <input type="hidden" name="siteId" value={props.siteId} />
        <fieldset className="ui-checkout-fieldset">
          <legend>{t(locale, "store.checkout.sectionContact")}</legend>
          <div>
            <Label htmlFor="email">{t(locale, "store.checkout.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={props.emailPrefill ?? ""}
            />
          </div>
          {props.signedIn && (props.addresses?.length ?? 0) > 0 ? (
            <div>
              <Label htmlFor="shippingAddressId">
                {t(locale, "store.checkout.savedAddress")}
              </Label>
              <Select
                id="shippingAddressId"
                name="shippingAddressId"
                defaultValue={defaultAddress?.id ?? ""}
              >
                <option value="">{t(locale, "store.checkout.newAddress")}</option>
                {(props.addresses ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}: {a.name}, {a.line1}, {a.postalCode} {a.city}
                  </option>
                ))}
              </Select>
              <Muted>{t(locale, "store.checkout.newAddressHint")}</Muted>
            </div>
          ) : null}
          <div>
            <Label htmlFor="name">{t(locale, "store.checkout.fullName")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={defaultAddress?.name ?? ""}
              required={!props.signedIn || !(props.addresses?.length)}
            />
          </div>
          <div>
            <Label htmlFor="line1">{t(locale, "store.checkout.address")}</Label>
            <Input
              id="line1"
              name="line1"
              defaultValue={defaultAddress?.line1 ?? ""}
              required={!props.signedIn || !(props.addresses?.length)}
            />
          </div>
          <div>
            <Label htmlFor="city">{t(locale, "store.checkout.city")}</Label>
            <Input
              id="city"
              name="city"
              defaultValue={defaultAddress?.city ?? ""}
              required={!props.signedIn || !(props.addresses?.length)}
            />
          </div>
          <div>
            <Label htmlFor="postalCode">{t(locale, "store.checkout.postalCode")}</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={defaultAddress?.postalCode ?? ""}
              required={!props.signedIn || !(props.addresses?.length)}
            />
          </div>
          <div>
            <Label htmlFor="country">{t(locale, "store.checkout.country")}</Label>
            <Select
              id="country"
              name="country"
              defaultValue={defaultAddress?.country ?? "FR"}
            >
              <option value="FR">{t(locale, "store.country.FR")}</option>
              <option value="BE">{t(locale, "store.country.BE")}</option>
              <option value="CH">{t(locale, "store.country.CH")}</option>
            </Select>
          </div>
          {props.signedIn ? (
            <div>
              <Label htmlFor="saveAddress">
                <input
                  id="saveAddress"
                  name="saveAddress"
                  type="checkbox"
                  value="1"
                />{" "}
                {t(locale, "store.checkout.saveAddress")}
              </Label>
            </div>
          ) : null}
        </fieldset>
        <fieldset className="ui-checkout-fieldset">
          <legend>{t(locale, "store.checkout.sectionShipping")}</legend>
          {props.shippingMethods.length > 0 ? (
            <div
              className="ui-shipping-radios"
              role="radiogroup"
              aria-label={t(locale, "store.checkout.shipping")}
            >
              {props.shippingMethods.map((m, index) => (
                <label key={m.id} className="ui-shipping-radio">
                  <input
                    type="radio"
                    name="shippingMethodId"
                    value={m.id}
                    defaultChecked={index === 0}
                    required
                  />
                  <span>
                    <strong>{m.name}</strong>
                    <br />
                    <Muted as="span">
                      {formatMoney(m.priceCents, m.currency)}
                    </Muted>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <Muted>{t(locale, "store.checkout.noShipping")}</Muted>
          )}
        </fieldset>
        <fieldset className="ui-checkout-fieldset">
          <legend>{t(locale, "store.checkout.sectionReview")}</legend>
          <div>
            <Label htmlFor="couponCode">{t(locale, "store.checkout.coupon")}</Label>
            <Input id="couponCode" name="couponCode" autoComplete="off" />
          </div>
          <Button type="submit">{t(locale, "store.checkout.placeOrder")}</Button>
        </fieldset>
      </StoreForm>
    </>
  );

  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
      accountHref={props.signedIn ? "/account" : "/account/sign-in"}
      accountLabel={
        props.signedIn
          ? t(locale, "store.nav.account")
          : t(locale, "store.nav.signIn")
      }
    >
      <StoreMain>
        <CheckoutLayout
          summary={
            <OrderSummary
              lines={props.cartItems.map((i) => ({
                label: `${i.name} × ${i.quantity}`,
                value: formatMoney(
                  i.unitPriceCents * i.quantity,
                  i.currency,
                ),
              }))}
              totalLabel={t(locale, "store.checkout.subtotal")}
              totalValue={formatMoney(props.subtotalCents, currency)}
            >
              <Muted>{t(locale, "store.checkout.shippingNext")}</Muted>
            </OrderSummary>
          }
        >
          {checkoutForm}
        </CheckoutLayout>
      </StoreMain>
    </Shell>
  );
}

export function OrderPage(props: {
  locale: Locale;
  siteId?: string;
  siteName: string;
  cartCount?: number;
  publicId: string;
  order?: {
    status: string;
    currency: string;
    subtotalCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    carrier?: string | null;
    trackingNumber?: string | null;
  };
  events?: OrderEventItem[];
}) {
  const o = props.order;
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
    >
      <StoreMain>
        <h1 className="ui-page-title">{t(locale, "store.order.received")}</h1>
        <Flash>
          {t(locale, "store.order.referenceFlash", {
            id: props.publicId,
            status: orderStatusLabel(locale, o?.status ?? "pending_payment"),
          })}
        </Flash>
        {o ? (
          <Muted>
            {t(locale, "store.order.totals", {
              subtotal: formatMoney(o.subtotalCents, o.currency),
              shipping: formatMoney(o.shippingCents, o.currency),
              tax: formatMoney(o.taxCents, o.currency),
              total: formatMoney(o.totalCents, o.currency),
            })}
          </Muted>
        ) : null}
        <TrackingLink
          locale={locale}
          carrier={o?.carrier}
          trackingNumber={o?.trackingNumber}
        />
        <OrderTimeline locale={locale} events={props.events} />
        <Muted>{t(locale, "store.order.cardLater")}</Muted>
        <ButtonLink href="/orders/track">{t(locale, "store.order.trackCta")}</ButtonLink>
        <ButtonLink href="/">{t(locale, "store.common.backToShop")}</ButtonLink>
      </StoreMain>
    </Shell>
  );
}

export function OrderTrackPage(props: {
  locale: Locale;
  siteId: string;
  siteName: string;
  cartCount?: number;
  error?: boolean;
  order?: {
    publicId: string;
    status: string;
    currency: string;
    totalCents: number;
    carrier?: string | null;
    trackingNumber?: string | null;
    events?: OrderEventItem[];
  } | null;
  emailPrefill?: string;
}) {
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
    >
      <StoreMain>
        <h1 className="ui-page-title">{t(locale, "store.order.trackHeading")}</h1>
        {props.error ? (
          <Flash>{t(locale, "store.order.trackError")}</Flash>
        ) : null}
        {props.order ? (
          <Stack gap="md">
            <Flash>
              {t(locale, "store.order.trackResult", {
                id: props.order.publicId,
                status: orderStatusLabel(locale, props.order.status),
              })}
            </Flash>
            <Muted>
              {t(locale, "store.order.total", {
                amount: formatMoney(
                  props.order.totalCents,
                  props.order.currency,
                ),
              })}
            </Muted>
            {props.order.trackingNumber || props.order.carrier ? (
              <TrackingLink
                locale={locale}
                carrier={props.order.carrier}
                trackingNumber={props.order.trackingNumber}
              />
            ) : (
              <Muted>{t(locale, "store.order.noTracking")}</Muted>
            )}
            <OrderTimeline locale={locale} events={props.order.events} />
          </Stack>
        ) : null}
        <StoreForm method="post" action="/actions/track-order">
          <input type="hidden" name="siteId" value={props.siteId} />
          <div>
            <Label htmlFor="email">{t(locale, "store.order.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={props.emailPrefill ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="orderPublicId">
              {t(locale, "store.order.referenceLabel")}
            </Label>
            <Input
              id="orderPublicId"
              name="orderPublicId"
              required
              defaultValue={props.order?.publicId ?? ""}
            />
          </div>
          <Button type="submit">{t(locale, "store.order.lookup")}</Button>
        </StoreForm>
      </StoreMain>
    </Shell>
  );
}

export function CmsPageView(props: {
  locale: Locale;
  siteId?: string;
  siteName: string;
  cartCount?: number;
  title: string;
  bodyJson?: Record<string, unknown>;
  markdown?: string;
  headerNav?: NavItem[];
  footerNav?: NavItem[];
  preview?: boolean;
}) {
  const blocks: CmsBlock[] =
    props.bodyJson != null
      ? normalizeBlocks(props.bodyJson)
      : props.markdown
        ? [{ id: "md", type: "richtext", text: props.markdown }]
        : [];
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
      headerNav={props.headerNav}
      footerNav={props.footerNav}
    >
      <StoreMain>
        {props.preview ? (
          <Flash>{t(locale, "store.cms.preview")}</Flash>
        ) : null}
        <article className="max-w-3xl space-y-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
            {props.title}
          </h1>
          <BlockRenderer blocks={blocks} locale={locale} />
        </article>
      </StoreMain>
    </Shell>
  );
}

export function AccountSignInPage(props: {
  locale: Locale;
  siteId: string;
  siteName: string;
  cartCount?: number;
  googleOAuth?: boolean;
  appleOAuth?: boolean;
  error?: boolean;
}) {
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
      accountHref="/account/sign-in"
      accountLabel={t(locale, "store.nav.signIn")}
    >
      <StoreMain>
        <h1>{t(locale, "store.account.signIn")}</h1>
        {props.error ? (
          <Flash>{t(locale, "store.account.signInError")}</Flash>
        ) : null}
        <StoreForm method="post" action="/actions/sign-in">
          <input type="hidden" name="siteId" value={props.siteId} />
          <div>
            <Label htmlFor="email">{t(locale, "store.account.email")}</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">{t(locale, "store.account.password")}</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit">{t(locale, "store.account.signIn")}</Button>
        </StoreForm>
        {props.googleOAuth ? (
          <form method="post" action="/actions/sign-in-google">
            <input type="hidden" name="siteId" value={props.siteId} />
            <Button type="submit" variant="ghost">
              {t(locale, "store.account.google")}
            </Button>
          </form>
        ) : null}
        {props.appleOAuth ? (
          <form method="post" action="/actions/sign-in-apple">
            <input type="hidden" name="siteId" value={props.siteId} />
            <Button type="submit" variant="ghost">
              {t(locale, "store.account.apple")}
            </Button>
          </form>
        ) : null}
        <Muted>
          {t(locale, "store.account.noAccount")}{" "}
          <a href="/account/sign-up">{t(locale, "store.account.createOne")}</a>
        </Muted>
      </StoreMain>
    </Shell>
  );
}

export function AccountSignUpPage(props: {
  locale: Locale;
  siteId: string;
  siteName: string;
  cartCount?: number;
  googleOAuth?: boolean;
  appleOAuth?: boolean;
  error?: boolean;
}) {
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
      accountHref="/account/sign-up"
      accountLabel={t(locale, "store.nav.signIn")}
    >
      <StoreMain>
        <h1>{t(locale, "store.account.create")}</h1>
        {props.error ? (
          <Flash>{t(locale, "store.account.signUpError")}</Flash>
        ) : null}
        <StoreForm method="post" action="/actions/sign-up">
          <input type="hidden" name="siteId" value={props.siteId} />
          <div>
            <Label htmlFor="name">{t(locale, "store.account.name")}</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">{t(locale, "store.account.email")}</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">{t(locale, "store.account.password")}</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <Button type="submit">{t(locale, "store.account.signUp")}</Button>
        </StoreForm>
        {props.googleOAuth ? (
          <form method="post" action="/actions/sign-in-google">
            <input type="hidden" name="siteId" value={props.siteId} />
            <Button type="submit" variant="ghost">
              {t(locale, "store.account.google")}
            </Button>
          </form>
        ) : null}
        {props.appleOAuth ? (
          <form method="post" action="/actions/sign-in-apple">
            <input type="hidden" name="siteId" value={props.siteId} />
            <Button type="submit" variant="ghost">
              {t(locale, "store.account.apple")}
            </Button>
          </form>
        ) : null}
        <Muted>
          {t(locale, "store.account.hasAccount")}{" "}
          <a href="/account/sign-in">{t(locale, "store.account.signIn")}</a>
        </Muted>
      </StoreMain>
    </Shell>
  );
}

export function AccountPage(props: {
  locale: Locale;
  siteId?: string;
  siteName: string;
  cartCount?: number;
  customer: { email: string; name: string | null };
  orders: Array<{
    publicId: string;
    status: string;
    currency: string;
    totalCents: number;
    createdAt: string;
  }>;
  returns?: Array<{
    id: string;
    status: string;
    reason: string;
    createdAt: string;
    orderPublicId: string;
  }>;
}) {
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
      accountHref="/account"
      accountLabel={t(locale, "store.nav.account")}
    >
      <StoreMain>
        <h1 className="ui-page-title">{t(locale, "store.account.heading")}</h1>
        <Muted>
          {props.customer.name ? `${props.customer.name} · ` : ""}
          {props.customer.email}
        </Muted>
        <form method="post" action="/actions/sign-out">
          <Button type="submit" variant="ghost">
            {t(locale, "store.account.signOut")}
          </Button>
        </form>
        <h2>{t(locale, "store.account.orders")}</h2>
        <Muted>
          {t(locale, "store.account.guestTrack")}{" "}
          <a href="/orders/track">{t(locale, "store.account.trackLink")}</a>{" "}
          {t(locale, "store.account.guestTrackHint")}
        </Muted>
        {props.orders.length === 0 ? (
          <EmptyState>{t(locale, "store.account.noOrders")}</EmptyState>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>{t(locale, "store.account.reference")}</Th>
                <Th>{t(locale, "store.account.status")}</Th>
                <Th>{t(locale, "store.account.totalCol")}</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {props.orders.map((o) => (
                <Tr key={o.publicId}>
                  <Td>
                    <code>{o.publicId}</code>
                  </Td>
                  <Td>{orderStatusLabel(locale, o.status)}</Td>
                  <Td>{formatMoney(o.totalCents, o.currency)}</Td>
                  <Td>
                    <a href={`/account/orders/${encodeURIComponent(o.publicId)}`}>
                      {t(locale, "store.account.view")}
                    </a>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <h2>{t(locale, "store.account.returns")}</h2>
        {(props.returns?.length ?? 0) === 0 ? (
          <EmptyState>{t(locale, "store.account.noReturns")}</EmptyState>
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>{t(locale, "store.account.reference")}</Th>
                <Th>{t(locale, "store.account.status")}</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {(props.returns ?? []).map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <code>{r.orderPublicId}</code>
                  </Td>
                  <Td>{returnStatusLabel(locale, r.status)}</Td>
                  <Td>
                    <Muted>{r.reason}</Muted>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        <ButtonLink href="/">
          {t(locale, "store.common.continueShopping")}
        </ButtonLink>
      </StoreMain>
    </Shell>
  );
}

export function AccountOrderPage(props: {
  locale: Locale;
  siteId: string;
  siteName: string;
  cartCount?: number;
  publicId: string;
  order?: {
    status: string;
    currency: string;
    subtotalCents: number;
    discountCents?: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    carrier?: string | null;
    trackingNumber?: string | null;
  };
  items?: Array<{
    id?: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  events?: OrderEventItem[];
  returnFlash?: "ok" | "error" | null;
}) {
  const o = props.order;
  const canReturn = o && (o.status === "paid" || o.status === "fulfilled");
  const { locale } = props;
  return (
    <Shell
      locale={locale}
      siteName={props.siteName}
      siteId={props.siteId}
      cartCount={props.cartCount}
      accountHref="/account"
      accountLabel={t(locale, "store.nav.account")}
    >
      <StoreMain>
        <h1 className="ui-page-title">
          {t(locale, "store.account.orderHeading", { id: props.publicId })}
        </h1>
        {props.returnFlash === "ok" ? (
          <Flash>{t(locale, "store.account.returnOk")}</Flash>
        ) : null}
        {props.returnFlash === "error" ? (
          <Flash>{t(locale, "store.account.returnError")}</Flash>
        ) : null}
        {o ? (
          <>
            <Flash>
              {t(locale, "store.account.statusFlash", {
                status: orderStatusLabel(locale, o.status),
              })}
            </Flash>
            <Muted>
              {t(locale, "store.account.orderTotals", {
                subtotal: formatMoney(o.subtotalCents, o.currency),
                discount:
                  (o.discountCents ?? 0) > 0
                    ? t(locale, "store.account.discount", {
                        amount: formatMoney(
                          o.discountCents ?? 0,
                          o.currency,
                        ),
                      })
                    : "",
                shipping: formatMoney(o.shippingCents, o.currency),
                total: formatMoney(o.totalCents, o.currency),
              })}
            </Muted>
            <TrackingLink
              locale={locale}
              carrier={o.carrier}
              trackingNumber={o.trackingNumber}
            />
            <OrderTimeline locale={locale} events={props.events} />
            <ul>
              {(props.items ?? []).map((i, idx) => (
                <li key={i.id ?? idx}>
                  {i.name} × {i.quantity} —{" "}
                  {formatMoney(i.unitPriceCents * i.quantity, o.currency)}
                </li>
              ))}
            </ul>
            {canReturn ? (
              <StoreForm method="post" action="/actions/request-return">
                <input type="hidden" name="siteId" value={props.siteId} />
                <input type="hidden" name="publicId" value={props.publicId} />
                <div>
                  <Label htmlFor="reason">
                    {t(locale, "store.account.requestReturn")}
                  </Label>
                  <Input id="reason" name="reason" required minLength={3} />
                </div>
                {(props.items?.length ?? 0) > 0 ? (
                  <fieldset className="ui-checkout-fieldset">
                    <legend>{t(locale, "store.account.returnItems")}</legend>
                    {(props.items ?? []).map((i, idx) => (
                      <label key={i.id ?? idx} className="ui-shipping-radio">
                        <input
                          type="checkbox"
                          name="returnItem"
                          value={JSON.stringify({
                            name: i.name,
                            quantity: i.quantity,
                            unitPriceCents: i.unitPriceCents,
                          })}
                        />
                        <span>
                          {t(locale, "store.account.returnItem", {
                            name: i.name,
                            quantity: i.quantity,
                          })}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : null}
                <Button type="submit">
                  {t(locale, "store.account.submitReturn")}
                </Button>
              </StoreForm>
            ) : null}
          </>
        ) : (
          <Flash>{t(locale, "store.account.orderNotFound")}</Flash>
        )}
        <ButtonLink href="/account">{t(locale, "store.account.back")}</ButtonLink>
      </StoreMain>
    </Shell>
  );
}
