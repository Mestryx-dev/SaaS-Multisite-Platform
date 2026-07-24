import React from "react";
import type { FormHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export type StoreHeaderProps = {
  brand: ReactNode;
  brandHref?: string;
  /** Reserved for future tagline under brand — not rendered yet */
  brandLine?: ReactNode;
  cartCount?: number;
  wishlistHref?: string;
  cartHref?: string;
  shopHref?: string;
  accountHref?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  accountLabel?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  cartLabel?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  wishlistLabel?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  searchPlaceholder?: string;
  /** Accessible name for the search field (defaults to searchPlaceholder). */
  searchAriaLabel?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  searchButtonLabel?: string;
  siteId?: string;
  /** Current search query (PLP) */
  searchQuery?: string | null;
  showSearch?: boolean;
  /** CMS header menu items (FB-088); empty = default Shop link only in extras */
  navItems?: Array<{ label: string; href: string }>;
  /**
   * Force scrolled (floating Soft glass dock) chrome.
   * Runtime storefront uses store-chrome.js + scroll; Storybook may set this.
   */
  scrolled?: boolean;
  className?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  menuToggleLabel?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  navAriaLabel?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  menuLabel?: string;
  /** EN default for Storybook / demos — shop link when navItems empty. */
  shopLabel?: string;
  /** EN default for Storybook / demos — theme toggle labels. */
  themeDarkLabel?: string;
  themeLightLabel?: string;
  themeTitle?: string;
};

export function StoreHeader({
  brand,
  brandHref = "/",
  cartCount = 0,
  wishlistHref = "/wishlist",
  cartHref = "/cart",
  shopHref = "/",
  accountHref = "/account/sign-in",
  accountLabel = "Sign in",
  cartLabel = "Cart",
  wishlistLabel = "Wishlist",
  searchPlaceholder = "Search products…",
  searchAriaLabel,
  searchButtonLabel = "Search",
  siteId,
  searchQuery = null,
  showSearch = true,
  navItems,
  scrolled = false,
  className,
  menuToggleLabel = "Toggle menu",
  navAriaLabel = "Primary",
  menuLabel = "Menu",
  shopLabel = "Shop",
  themeDarkLabel = "Switch to dark theme",
  themeLightLabel = "Switch to light theme",
  themeTitle = "Theme",
}: StoreHeaderProps) {
  const extraNav =
    navItems && navItems.length > 0
      ? navItems
      : [{ label: shopLabel, href: shopHref }];
  const navId = "mx-store-nav";
  const navCheckId = "mx-store-nav-check";
  const resolvedSearchAria = searchAriaLabel ?? searchPlaceholder;

  return (
    <header
      className={cn("ui-store-header", scrolled && "is-scrolled", className)}
      data-mx-site-id={siteId}
      data-mx-store-header
    >
      <a
        className={cn(
          "ui-store-brand",
          "font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--foreground)]",
        )}
        href={brandHref}
      >
        {brand}
      </a>

      {showSearch ? (
        <form
          method="get"
          action="/"
          className="ui-store-header-search"
          role="search"
        >
          <input
            type="search"
            name="q"
            defaultValue={searchQuery ?? ""}
            placeholder={searchPlaceholder}
            aria-label={resolvedSearchAria}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
          />
          <button
            type="submit"
            className="rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)]"
          >
            {searchButtonLabel}
          </button>
        </form>
      ) : (
        <div className="ui-store-header-search ui-store-header-search--empty" aria-hidden />
      )}

      {/* Progressive: checkbox + label works without JS; island syncs Escape. */}
      <input
        type="checkbox"
        id={navCheckId}
        className="ui-store-nav-check"
        data-mx-nav-check
        aria-controls={navId}
        aria-label={menuToggleLabel}
      />

      <nav
        id={navId}
        className={cn("ui-store-nav")}
        data-mx-nav-panel
        aria-label={navAriaLabel}
      >
        {extraNav.map((item) => (
          <a
            key={`${item.href}-${item.label}`}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            href={item.href}
          >
            {item.label}
          </a>
        ))}
        {/*
          Right-cluster order (LTR e-com): browse → save → identity → prefs → cart.
          Cart stays in `.ui-store-header-actions` as the rightmost commerce CTA.
        */}
        <a
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          href={wishlistHref}
        >
          {wishlistLabel}
        </a>
        <a
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          href={accountHref}
        >
          {accountLabel}
        </a>
        <StoreThemeToggle
          siteId={siteId}
          darkLabel={themeDarkLabel}
          lightLabel={themeLightLabel}
          title={themeTitle}
        />
      </nav>

      <div className="ui-store-header-actions">
        <a
          className={cn(
            "ui-store-cart-btn",
            "inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--primary)]/30 bg-[var(--primary-foreground)] px-3 py-1.5 text-sm font-semibold text-[var(--primary)] no-underline hover:opacity-90",
          )}
          href={cartHref}
          data-mx-cart-open
        >
          {cartLabel}
          {cartCount > 0 ? (
            <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-xs font-bold text-[var(--primary-foreground)]">
              {cartCount}
            </span>
          ) : null}
        </a>
        <label
          htmlFor={navCheckId}
          className="ui-store-nav-toggle"
          data-mx-nav-toggle
          aria-controls={navId}
        >
          <span className="ui-store-nav-toggle-bars" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span className="sr-only">{menuLabel}</span>
        </label>
      </div>
    </header>
  );
}

export type StoreThemeToggleProps = {
  siteId?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  darkLabel?: string;
  lightLabel?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  title?: string;
};

/** Per-site light/dark toggle — persisted in localStorage (`mx-store-theme:{siteId}`). */
export function StoreThemeToggle({
  siteId,
  darkLabel = "Switch to dark theme",
  lightLabel = "Switch to light theme",
  title = "Theme",
}: StoreThemeToggleProps) {
  const storageKey = siteId ? `mx-store-theme:${siteId}` : "mx-store-theme";
  return (
    <button
      type="button"
      className="ui-store-theme-toggle"
      data-mx-theme-toggle
      data-mx-theme-storage={storageKey}
      data-mx-theme-label-dark={darkLabel}
      data-mx-theme-label-light={lightLabel}
      aria-label={darkLabel}
      title={title}
    >
      <span className="ui-store-theme-toggle-icon ui-store-theme-toggle-icon--sun" aria-hidden>
        ☀
      </span>
      <span className="ui-store-theme-toggle-icon ui-store-theme-toggle-icon--moon" aria-hidden>
        ☾
      </span>
    </button>
  );
}

export type StoreFooterColumn = {
  title: string;
  items: Array<{ label: string; href: string }>;
};

export type StoreFooterProps = {
  brand?: ReactNode;
  /** Prefer explicit columns from chrome; falls back to {@link DEFAULT_FOOTER_COLUMNS} (EN demo). */
  columns?: StoreFooterColumn[];
  /** @deprecated Prefer `columns` — flat link list for legacy callers */
  items?: Array<{ label: string; href: string }>;
  shopHref?: string;
};

/**
 * EN demo footer columns for Storybook / local demos.
 * Runtime chrome should pass localized `columns` instead of relying on this default.
 */
export const DEFAULT_FOOTER_COLUMNS: StoreFooterColumn[] = [
  {
    title: "Shop",
    items: [{ label: "All products", href: "/" }],
  },
  {
    title: "Help",
    items: [{ label: "Track order", href: "/orders/track" }],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Legal", href: "/legal" },
    ],
  },
];

export function StoreFooter({ brand, columns, items, shopHref = "/" }: StoreFooterProps) {
  if (items && items.length > 0 && !columns) {
    return (
      <footer
        className={cn(
          "ui-store-footer",
          "mt-16 border-t border-[var(--border)] px-4 py-8 text-sm text-[var(--muted-foreground)] md:px-8",
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-4" aria-label="Footer">
          {items.map((l) => (
            <a key={`${l.href}-${l.label}`} href={l.href} className="hover:text-[var(--foreground)]">
              {l.label}
            </a>
          ))}
        </nav>
      </footer>
    );
  }

  const resolvedColumns =
    columns && columns.length > 0
      ? columns
      : DEFAULT_FOOTER_COLUMNS.map((col) =>
          col.title === "Shop"
            ? { ...col, items: [{ label: "All products", href: shopHref }] }
            : col,
        );

  return (
    <footer
      className={cn(
        "ui-store-footer",
        "mt-16 border-t border-[var(--border)] px-4 py-10 text-sm text-[var(--muted-foreground)] md:px-8",
      )}
    >
      <div className="ui-store-footer-grid mx-auto max-w-6xl">
        {brand ? (
          <div className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--foreground)]">
            {brand}
          </div>
        ) : null}
        {resolvedColumns.map((col) => (
          <div key={col.title} className="space-y-3">
            <p className="font-semibold text-[var(--foreground)]">{col.title}</p>
            <ul className="space-y-2">
              {col.items.map((l) => (
                <li key={`${l.href}-${l.label}`}>
                  <a href={l.href} className="hover:text-[var(--foreground)]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

export type PriceDisplayProps = {
  priceLabel: string;
  compareAtLabel?: string | null;
  badge?: string | null;
};

export function PriceDisplay({ priceLabel, compareAtLabel, badge }: PriceDisplayProps) {
  return (
    <div className="ui-price flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">{priceLabel}</span>
      {compareAtLabel ? (
        <span className="ui-price-compare text-sm">{compareAtLabel}</span>
      ) : null}
      {badge ? <span className="ui-price-badge">{badge}</span> : null}
    </div>
  );
}

export type ProductCardData = {
  name: string;
  slug: string;
  priceLabel: string;
  compareAtLabel?: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  href?: string;
};

export function ProductCard({
  name,
  slug,
  priceLabel,
  compareAtLabel,
  badge,
  imageUrl,
  href,
}: ProductCardData) {
  const to = href ?? `/p/${slug}`;
  return (
    <a
      className={cn(
        "ui-product-card",
        "group flex flex-col gap-2 text-[var(--foreground)] no-underline",
      )}
      href={to}
    >
      <div className="ui-product-card-media relative overflow-hidden rounded-[var(--radius)]">
        {badge ? (
          <span className="ui-price-badge absolute left-2 top-2 z-[1]">{badge}</span>
        ) : null}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="aspect-square w-full bg-[var(--muted)]" aria-hidden />
        )}
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold group-hover:underline">
        {name}
      </h2>
      <PriceDisplay priceLabel={priceLabel} compareAtLabel={compareAtLabel} />
    </a>
  );
}

export function ProductGrid({
  children,
  className,
  featured = false,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "ui-product-grid",
        featured && "ui-product-grid--featured",
        "grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3",
        featured && "lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Flash({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "ui-flash",
        "rounded-[var(--radius)] border border-[var(--flash-border)] bg-[var(--flash-bg)] px-4 py-3 text-sm",
      )}
    >
      {children}
    </div>
  );
}

export function StoreMain({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn("ui-store-main", "mx-auto max-w-6xl px-4 py-8 md:px-8", className)}
    >
      {children}
    </main>
  );
}

export type StoreHeroProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Lifestyle / merch image for vitrine full-bleed */
  imageUrl?: string | null;
  /** `vitrine` = store-window hero (image + overlay). Default = text ambient. */
  variant?: "default" | "vitrine";
  className?: string;
};

export function StoreHero({
  title,
  description,
  actions,
  imageUrl,
  variant = "default",
  className,
}: StoreHeroProps) {
  const isVitrine = variant === "vitrine";
  return (
    <section
      className={cn(
        "ui-store-hero",
        isVitrine && "ui-store-hero--vitrine",
        !isVitrine &&
          "relative -mx-4 mb-10 overflow-hidden border-b border-[var(--border)] bg-[image:var(--background-ambient)] px-4 py-16 md:-mx-6 md:px-6 md:py-24",
        className,
      )}
    >
      {isVitrine && imageUrl ? (
        <img
          className="ui-store-hero-media"
          src={imageUrl}
          alt=""
          fetchPriority="high"
        />
      ) : null}
      {isVitrine ? <div className="ui-store-hero-scrim" aria-hidden /> : null}
      <div
        className={cn(
          "ui-store-hero-copy",
          isVitrine ? "ui-store-hero-copy--vitrine" : "mx-auto max-w-5xl space-y-4",
        )}
      >
        <h1
          className={cn(
            "font-[family-name:var(--font-display)] font-semibold tracking-tight",
            isVitrine
              ? "text-4xl text-[var(--primary-foreground)] md:text-5xl lg:text-6xl"
              : "text-4xl md:text-5xl lg:text-6xl",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              "max-w-xl text-base md:text-lg",
              isVitrine ? "ui-store-hero-lede" : "text-[var(--muted-foreground)]",
            )}
          >
            {description}
          </p>
        ) : null}
        {actions ? <div className="flex flex-wrap gap-3 pt-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export type StoreSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Editorial section on the vitrine home (collections, featured rail). */
export function StoreSection({
  title,
  description,
  action,
  children,
  className,
}: StoreSectionProps) {
  return (
    <section className={cn("ui-store-section", className)}>
      <div className="ui-store-section-head">
        <div className="min-w-0 space-y-1">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm text-[var(--muted-foreground)] md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export type CollectionCardData = {
  name: string;
  slug: string;
  href?: string;
  imageUrl?: string | null;
};

/** Category as store-window tile — not a filter pill. */
export function CollectionCard({ name, slug, href, imageUrl }: CollectionCardData) {
  const to = href ?? `/?category=${encodeURIComponent(slug)}`;
  return (
    <a className="ui-collection-card" href={to}>
      <div className="ui-collection-card-media">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="ui-collection-card-placeholder" aria-hidden />
        )}
      </div>
      <span className="ui-collection-card-label">{name}</span>
    </a>
  );
}

export function CollectionGrid({ children }: { children: ReactNode }) {
  return <div className="ui-collection-grid">{children}</div>;
}

export type PromoBannerData = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  href?: string | null;
};

export function PromoBanners({ banners }: { banners: PromoBannerData[] }) {
  if (banners.length === 0) return null;
  return (
    <section className={cn("ui-promo-banners", "mb-10 space-y-4")}>
      {banners.map((b) => {
        const inner = (
          <>
            {b.imageUrl ? (
              <img
                src={b.imageUrl}
                alt=""
                className="max-h-48 w-full object-cover"
              />
            ) : null}
            <div className="space-y-1 p-4">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                {b.title}
              </h2>
              {b.subtitle ? (
                <p className="text-sm text-[var(--muted-foreground)]">{b.subtitle}</p>
              ) : null}
            </div>
          </>
        );
        const className = cn(
          "ui-promo-banner",
          "block overflow-hidden rounded-[var(--radius)] border border-[var(--border)]/60 no-underline text-[var(--foreground)]",
        );
        return b.href ? (
          <a key={b.id} href={b.href} className={className}>
            {inner}
          </a>
        ) : (
          <div key={b.id} className={className}>
            {inner}
          </div>
        );
      })}
    </section>
  );
}

export function CategoryNav({
  items,
  activeSlug,
  allLabel = "All",
  ariaLabel = "Collections",
}: {
  items: Array<{ name: string; slug: string }>;
  activeSlug?: string | null;
  allLabel?: string;
  ariaLabel?: string;
}) {
  const pillClass = (active: boolean) =>
    cn(
      "ui-cat-nav-pill rounded-[var(--radius)] px-3 py-1.5 text-sm transition-colors",
      active ? "ui-cat-nav-pill--active" : "ui-cat-nav-pill--idle",
    );

  return (
    <nav className={cn("ui-cat-nav", "mb-8 flex flex-wrap gap-2")} aria-label={ariaLabel}>
      <a href="/" data-active={!activeSlug ? "true" : "false"} className={pillClass(!activeSlug)}>
        {allLabel}
      </a>
      {items.map((cat) => (
        <a
          key={cat.slug}
          href={`/?category=${encodeURIComponent(cat.slug)}`}
          data-active={activeSlug === cat.slug ? "true" : "false"}
          className={pillClass(activeSlug === cat.slug)}
        >
          {cat.name}
        </a>
      ))}
    </nav>
  );
}

export type TrustStripItem = {
  title: string;
  description?: string;
};

export type TrustStripProps = {
  /** Prefer explicit items from chrome; falls back to {@link DEFAULT_TRUST_ITEMS} (EN demo). */
  items?: TrustStripItem[];
  ariaLabel?: string;
};

/**
 * EN demo trust strip for Storybook / local demos.
 * Runtime chrome should pass localized `items` instead of relying on this default.
 */
export const DEFAULT_TRUST_ITEMS: TrustStripItem[] = [
  { title: "Free shipping", description: "On orders over threshold" },
  { title: "Easy returns", description: "30-day hassle-free returns" },
  { title: "Secure checkout", description: "Encrypted payment processing" },
];

export function TrustStrip({
  items = DEFAULT_TRUST_ITEMS,
  ariaLabel = "Store policies",
}: TrustStripProps) {
  return (
    <section className="ui-trust-strip" aria-label={ariaLabel}>
      {items.map((item) => (
        <div key={item.title} className="space-y-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
          {item.description ? (
            <p className="text-xs text-[var(--muted-foreground)]">{item.description}</p>
          ) : null}
        </div>
      ))}
    </section>
  );
}

export type ProductGalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
};

export type ProductGalleryProps = {
  images: ProductGalleryImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="ui-pdp-gallery">
        <div
          id="mx-gallery-main"
          className="aspect-square w-full rounded-[var(--radius)] bg-[var(--muted)]"
          aria-hidden
        />
      </div>
    );
  }

  const primary = images[0]!;

  return (
    <div className="ui-pdp-gallery">
      <img
        id="mx-gallery-main"
        src={primary.url}
        alt={primary.alt ?? productName}
        className="aspect-square w-full rounded-[var(--radius)] object-cover"
      />
      {images.length > 1 ? (
        <div className="ui-pdp-gallery-thumbs flex flex-wrap gap-2">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              data-mx-gallery-thumb
              data-src={img.url}
              data-active={index === 0 ? "true" : "false"}
              className="ui-pdp-gallery-thumb overflow-hidden rounded-[var(--radius)] border border-[var(--border)] p-0"
              aria-label={`View ${img.alt ?? productName}`}
              aria-pressed={index === 0}
            >
              <img
                src={img.url}
                alt={img.alt ?? productName}
                className="h-16 w-16 object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export type CheckoutLayoutProps = {
  children: ReactNode;
  summary: ReactNode;
};

export function CheckoutLayout({ children, summary }: CheckoutLayoutProps) {
  return (
    <div className="ui-checkout-layout">
      <div>{children}</div>
      <aside className="ui-checkout-summary">{summary}</aside>
    </div>
  );
}

export type OrderSummaryLine = {
  label: string;
  value: string;
};

export type OrderSummaryProps = {
  lines: OrderSummaryLine[];
  totalLabel: string;
  totalValue: string;
  children?: ReactNode;
};

export function OrderSummary({ lines, totalLabel, totalValue, children }: OrderSummaryProps) {
  return (
    <div className="ui-order-summary space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4">
      <dl className="space-y-2 text-sm">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-4">
            <dt className="text-[var(--muted-foreground)]">{line.label}</dt>
            <dd className="font-medium">{line.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-3 text-base font-semibold">
        <span>{totalLabel}</span>
        <span>{totalValue}</span>
      </div>
      {children}
    </div>
  );
}

export type CartLineProps = {
  itemId: string;
  siteId: string;
  name: string;
  href: string;
  imageUrl?: string | null;
  quantity: number;
  lineTotalLabel: string;
  currency?: string;
  quantityLabel?: string;
  updateLabel?: string;
  removeLabel?: string;
};

export function CartLine({
  itemId,
  siteId,
  name,
  href,
  imageUrl,
  quantity,
  lineTotalLabel,
  quantityLabel = "Quantity",
  updateLabel = "Update",
  removeLabel = "Remove",
}: CartLineProps) {
  return (
    <article className="ui-cart-line">
      {imageUrl ? (
        <a href={href} className="shrink-0 overflow-hidden rounded-[var(--radius)]">
          <img src={imageUrl} alt={name} className="h-20 w-20 object-cover" />
        </a>
      ) : (
        <div
          className="h-20 w-20 shrink-0 rounded-[var(--radius)] bg-[var(--muted)]"
          aria-hidden
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <a href={href} className="font-medium text-[var(--foreground)] hover:underline">
          {name}
        </a>
        <p className="text-sm font-semibold">{lineTotalLabel}</p>
        <form
          method="post"
          action="/actions/update-cart-item"
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="siteId" value={siteId} />
          <label className="sr-only" htmlFor={`qty-${itemId}`}>
            {quantityLabel}
          </label>
          <input
            id={`qty-${itemId}`}
            type="number"
            name="quantity"
            min={1}
            defaultValue={quantity}
            className="w-16 rounded-[var(--radius)] border border-[var(--border)] px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="rounded-[var(--radius)] border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]"
          >
            {updateLabel}
          </button>
        </form>
        <form method="post" action="/actions/update-cart-item">
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="siteId" value={siteId} />
          <input type="hidden" name="quantity" value={0} />
          <button type="submit" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)]">
            {removeLabel}
          </button>
        </form>
      </div>
    </article>
  );
}

export type CheckoutStepsProps = {
  steps: string[];
  /** Zero-based index of the current step. */
  current?: number;
  className?: string;
};

/** Soft boutique checkout progress (informational; single-page form sections). */
export function CheckoutSteps({
  steps,
  current = 0,
  className,
}: CheckoutStepsProps) {
  return (
    <ol className={cn("ui-checkout-steps", className)} aria-label="Checkout steps">
      {steps.map((label, index) => (
        <li
          key={`${index}-${label}`}
          className={cn(
            "ui-checkout-step",
            index === current && "is-current",
            index < current && "is-done",
          )}
          aria-current={index === current ? "step" : undefined}
        >
          <span className="ui-checkout-step-index" aria-hidden>
            {index + 1}
          </span>
          <span className="ui-checkout-step-label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

export type CartDrawerProps = {
  siteId?: string;
  /** Storybook / demos — open glass drawer without the client island. */
  open?: boolean;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  title?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  loadingLabel?: string;
  /** Optional custom loading body; when set, replaces the default inline loader. */
  loadingContent?: ReactNode;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  viewCartLabel?: string;
  /** EN default for Storybook / demos — pass locale copy from chrome. */
  checkoutLabel?: string;
  /** Accessible name for the close control. */
  closeLabel?: string;
  cartHref?: string;
  checkoutHref?: string;
};

export function CartDrawer({
  siteId,
  open = false,
  title = "Your cart",
  loadingLabel = "Loading cart…",
  loadingContent,
  viewCartLabel = "View cart",
  checkoutLabel = "Checkout",
  closeLabel = "Close",
  cartHref = "/cart",
  checkoutHref = "/checkout",
}: CartDrawerProps) {
  return (
    <>
      <div
        id="mx-cart-overlay"
        className={cn("ui-cart-overlay", open && "is-open")}
        hidden={!open}
        data-mx-cart-overlay
      />
      <aside
        id="mx-cart-drawer"
        className={cn("ui-cart-drawer", open && "is-open")}
        hidden={!open}
        data-mx-cart-drawer
        aria-label={title}
        data-mx-site-id={siteId}
      >
        <div className="ui-cart-drawer-header">
          <h2>{title}</h2>
          <button type="button" data-mx-cart-close aria-label={closeLabel}>
            ×
          </button>
        </div>
        <div data-mx-cart-body className="ui-cart-drawer-body">
          {loadingContent ?? (
            <div
              className="ui-store-loading ui-store-loading--inline"
              role="status"
              aria-busy="true"
              aria-live="polite"
              aria-label={loadingLabel}
            >
              <div className="ui-store-loading__stage">
                <div className="ui-store-loading__mark" aria-hidden>
                  <span className="ui-store-loading__ring" />
                  <span className="ui-store-loading__orbit" />
                  <span className="ui-store-loading__core">·</span>
                </div>
                <div className="ui-store-loading__copy">
                  <p className="ui-store-loading__status">{loadingLabel}</p>
                </div>
                <div className="ui-store-loading__track" aria-hidden>
                  <span className="ui-store-loading__bar" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="ui-cart-drawer-footer">
          <a href={cartHref}>{viewCartLabel}</a>
          <a href={checkoutHref} className="ui-cart-drawer-checkout">
            {checkoutLabel}
          </a>
        </div>
      </aside>
    </>
  );
}

export function StoreForm({
  children,
  className,
  ...rest
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form className={cn("ui-store-form", "flex flex-col gap-4", className)} {...rest}>
      {children}
    </form>
  );
}

export type PlpToolbarProps = {
  children: ReactNode;
  className?: string;
};

/** Full-width PLP filter toolbar — not constrained like auth StoreForm. */
export function PlpToolbar({ children, className }: PlpToolbarProps) {
  return (
    <div className={cn("ui-plp-toolbar", className)} role="search">
      {children}
    </div>
  );
}

export type PriceRangeInputsProps = {
  minName?: string;
  maxName?: string;
  minId?: string;
  maxId?: string;
  minDefault?: string | null;
  maxDefault?: string | null;
  currencySymbol?: string;
  className?: string;
  priceLabel?: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  minAriaLabel?: string;
  maxAriaLabel?: string;
};

/**
 * Compact price range for PLP — one visual group, not stacked Label+Input columns.
 */
export function PriceRangeInputs({
  minName = "minPrice",
  maxName = "maxPrice",
  minId = "minPrice",
  maxId = "maxPrice",
  minDefault = null,
  maxDefault = null,
  currencySymbol = "€",
  className,
  priceLabel = "Price",
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  minAriaLabel,
  maxAriaLabel,
}: PriceRangeInputsProps) {
  return (
    <div className={cn("ui-price-range", className)}>
      <span className="ui-price-range-label" id={`${minId}-label`}>
        {priceLabel}
      </span>
      <div
        className="ui-price-range-group"
        role="group"
        aria-labelledby={`${minId}-label`}
      >
        <span className="ui-price-range-currency" aria-hidden>
          {currencySymbol}
        </span>
        <label className="sr-only" htmlFor={minId}>
          {minAriaLabel ?? `Minimum price (${currencySymbol})`}
        </label>
        <input
          id={minId}
          name={minName}
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder={minPlaceholder}
          defaultValue={minDefault ?? ""}
          className="ui-price-range-input"
        />
        <span className="ui-price-range-sep" aria-hidden>
          –
        </span>
        <label className="sr-only" htmlFor={maxId}>
          {maxAriaLabel ?? `Maximum price (${currencySymbol})`}
        </label>
        <input
          id={maxId}
          name={maxName}
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder={maxPlaceholder}
          defaultValue={maxDefault ?? ""}
          className="ui-price-range-input"
        />
      </div>
    </div>
  );
}

export function PdpLayout({
  media,
  children,
}: {
  media: ReactNode;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        "ui-pdp",
        "grid gap-10 md:grid-cols-2 md:items-start",
      )}
    >
      {media}
      <div className="space-y-4">{children}</div>
    </article>
  );
}
