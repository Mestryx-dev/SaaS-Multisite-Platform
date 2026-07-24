import { config as loadDotenv } from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createElement } from "react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveHostKind } from "@mestryx/host-resolution";
import { normalizeLocale } from "./i18n/index.js";
import type { PublicPage, PublicSite } from "./seo.js";
import { notFoundHtml, renderStorePage } from "./render.js";
import { productJsonLd, type StoreProduct } from "./storefront.js";
import {
  AccountOrderPage,
  AccountPage,
  AccountSignInPage,
  AccountSignUpPage,
  CartPage,
  CheckoutPage,
  CmsPageView,
  HomePage,
  OrderPage,
  OrderTrackPage,
  ProductPage,
  WishlistPage,
  type SavedAddress,
} from "./views.js";

const repoRoot = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../..",
);
if (process.env.NODE_ENV !== "production") {
  loadDotenv({ path: resolve(repoRoot, ".env") });
}

const port = Number(process.env.WEB_PORT ?? process.env.PORT ?? 3002);
const apiUrl = process.env.API_URL ?? "http://localhost:3001";
const sitesHostSuffix =
  process.env.PUBLIC_SITES_HOST_SUFFIX ?? "sites.mestryx.dev";
const devSiteId = process.env.WEB_DEV_SITE_ID ?? "";

const defaultCsp =
  process.env.SECURITY_CSP === ""
    ? null
    : (process.env.SECURITY_CSP ??
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:* https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");

function applySecurityHeaders(c: {
  header: (k: string, v: string) => void;
}) {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (defaultCsp) c.header("Content-Security-Policy", defaultCsp);
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${apiUrl}${path}`, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function forwardSetCookies(from: Response, to: { header: (k: string, v: string, opts?: { append?: boolean }) => void }) {
  for (const sc of from.headers.getSetCookie?.() ?? []) {
    to.header("set-cookie", sc, { append: true });
  }
}

function applySetCookieHeaders(
  c: { header: (k: string, v: string, opts?: { append?: boolean }) => void },
  cookies: string[],
) {
  for (const sc of cookies) {
    c.header("set-cookie", sc, { append: true });
  }
}

type CartSummaryItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  slug: string;
  imageUrl?: string | null;
};

async function loadCartSummary(siteId: string, cookie: string) {
  if (siteId === "local") {
    return {
      items: [] as CartSummaryItem[],
      subtotalCents: 0,
      count: 0,
      setCookies: [] as string[],
    };
  }
  try {
    const res = await fetch(
      `${apiUrl}/v1/public/cart?siteId=${encodeURIComponent(siteId)}`,
      { headers: { cookie } },
    );
    if (!res.ok) {
      return {
        items: [] as CartSummaryItem[],
        subtotalCents: 0,
        count: 0,
        setCookies: res.headers.getSetCookie?.() ?? [],
      };
    }
    const data = (await res.json()) as {
      cart: {
        items: CartSummaryItem[];
        subtotalCents: number;
      };
    };
    const count = data.cart.items.reduce((s, i) => s + i.quantity, 0);
    return {
      ...data.cart,
      count,
      setCookies: res.headers.getSetCookie?.() ?? [],
    };
  } catch {
    return {
      items: [] as CartSummaryItem[],
      subtotalCents: 0,
      count: 0,
      setCookies: [] as string[],
    };
  }
}

function priceEuroQueryToCents(value: string | null): string | null {
  if (value == null || value === "") return null;
  const euros = Number(value);
  if (Number.isNaN(euros) || euros < 0) return null;
  return String(Math.round(euros * 100));
}

async function loadAccount(
  siteId: string,
  cookie: string,
): Promise<{
  customer: { email: string; name: string | null };
  googleOAuth: boolean;
  appleOAuth: boolean;
} | null> {
  const data = await fetchJson<{
    customer: { email: string; name: string | null };
    googleOAuth: boolean;
    appleOAuth: boolean;
  }>(`/v1/storefront/me?siteId=${encodeURIComponent(siteId)}`, {
    headers: { cookie },
  });
  return data;
}

async function resolveSite(host: string): Promise<PublicSite | null> {
  const data = await fetchJson<{ site: PublicSite }>(
    `/v1/public/resolve-host?host=${encodeURIComponent(host)}`,
  );
  return data?.site ?? null;
}

async function loadMenus(siteId: string) {
  if (siteId === "local") {
    return { header: [] as Array<{ label: string; href: string }>, footer: [] as Array<{ label: string; href: string }> };
  }
  const data = await fetchJson<{
    menus: {
      header: Array<{ label: string; href: string }>;
      footer: Array<{ label: string; href: string }>;
    };
  }>(`/v1/public/sites/${siteId}/menus`);
  return data?.menus ?? { header: [], footer: [] };
}

function pageHtml(
  site: PublicSite,
  path: string,
  origin: string,
  title: string,
  description: string,
  element: ReturnType<typeof createElement>,
  jsonLd?: Record<string, unknown>,
) {
  return renderStorePage({
    site,
    path,
    origin,
    title,
    description,
    element,
    jsonLd,
    locale: normalizeLocale(site.defaultLocale),
  });
}

export function createWebApp() {
  const app = new Hono();

  app.use("*", async (c, next) => {
    await next();
    applySecurityHeaders(c);
  });

  app.get("/robots.txt", async (c) => {
    const host = (c.req.header("host") ?? "localhost").split(":")[0]!;
    return c.text(`User-agent: *\nAllow: /\nSitemap: https://${host}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", async (c) => {
    const host = (c.req.header("host") ?? "localhost").split(":")[0]!;
    const site = await resolveSite(host);
    const urls = [`https://${host}/`];
    if (site && site.id !== "local") {
      const catalog = await fetchJson<{ products: StoreProduct[] }>(
        `/v1/public/sites/${site.id}/products`,
      );
      for (const p of catalog?.products ?? []) {
        urls.push(`https://${host}/p/${p.slug}`);
      }
    }
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;
    return c.body(body, 200, { "content-type": "application/xml; charset=utf-8" });
  });

  app.get("/llms.txt", async (c) => {
    const host = (c.req.header("host") ?? "localhost").split(":")[0]!;
    const site = await resolveSite(host);
    const intro =
      site?.llmsIntro ??
      `${site?.name ?? host} — ecommerce storefront on mestryx-platform.`;
    return c.text(
      [`# ${site?.name ?? host}`, "", intro, "", `> Shop: https://${host}/`].join("\n"),
    );
  });

  app.get("/shop", (c) => c.redirect("/", 301));
  app.get("/shop/*", (c) => {
    const rest = c.req.path.replace(/^\/shop\/?/, "");
    return c.redirect(rest ? `/p/${rest}` : "/", 301);
  });

  app.post("/actions/add-to-cart", async (c) => {
    const form = await c.req.parseBody();
    const siteId = String(form.siteId ?? "");
    const productId = String(form.productId ?? "");
    const variantId = String(form.variantId ?? "");
    const slug = String(form.slug ?? "");
    const quantity = Math.min(
      99,
      Math.max(1, Number(form.quantity ?? 1) || 1),
    );
    const cookie = c.req.header("cookie") ?? "";
    const res = await fetch(`${apiUrl}/v1/public/cart/items`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        siteId,
        productId,
        quantity,
        ...(variantId ? { variantId } : {}),
      }),
    });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    const redirect = `/p/${encodeURIComponent(slug)}?added=1`;
    if (setCookie.length) {
      for (const sc of setCookie) c.header("set-cookie", sc, { append: true });
    } else {
      const single = res.headers.get("set-cookie");
      if (single) c.header("set-cookie", single);
    }
    return c.redirect(redirect, 303);
  });

  app.post("/actions/add-wishlist", async (c) => {
    const form = await c.req.parseBody();
    const siteId = String(form.siteId ?? "");
    const productId = String(form.productId ?? "");
    const slug = String(form.slug ?? "");
    const cookie = c.req.header("cookie") ?? "";
    const res = await fetch(`${apiUrl}/v1/public/wishlist/items`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ siteId, productId }),
    });
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      c.header("set-cookie", sc, { append: true });
    }
    return c.redirect(`/p/${encodeURIComponent(slug)}?wish=1`, 303);
  });

  app.post("/actions/remove-wishlist", async (c) => {
    const form = await c.req.parseBody();
    const siteId = String(form.siteId ?? "");
    const productId = String(form.productId ?? "");
    const cookie = c.req.header("cookie") ?? "";
    const res = await fetch(
      `${apiUrl}/v1/public/wishlist/items/${encodeURIComponent(productId)}?siteId=${encodeURIComponent(siteId)}`,
      { method: "DELETE", headers: { cookie } },
    );
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      c.header("set-cookie", sc, { append: true });
    }
    return c.redirect("/wishlist?removed=1", 303);
  });

  app.post("/actions/wishlist-to-cart", async (c) => {
    const form = await c.req.parseBody();
    const siteId = String(form.siteId ?? "");
    const productId = String(form.productId ?? "");
    const cookie = c.req.header("cookie") ?? "";
    const res = await fetch(`${apiUrl}/v1/public/cart/items`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify({ siteId, productId, quantity: 1 }),
    });
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      c.header("set-cookie", sc, { append: true });
    }
    if (!res.ok) return c.redirect("/wishlist?error=1", 303);
    return c.redirect("/wishlist?cart=1", 303);
  });

  app.post("/actions/checkout", async (c) => {
    const form = await c.req.parseBody();
    const siteId = String(form.siteId ?? "");
    const cookie = c.req.header("cookie") ?? "";
    const shippingMethodId = String(form.shippingMethodId ?? "");
    const couponCode = String(form.couponCode ?? "").trim();
    const shippingAddressId = String(form.shippingAddressId ?? "").trim();
    const saveAddress = String(form.saveAddress ?? "") === "1";
    const name = String(form.name ?? "");
    const line1 = String(form.line1 ?? "");
    const city = String(form.city ?? "");
    const postalCode = String(form.postalCode ?? "");
    const country = String(form.country ?? "FR");

    const body: Record<string, unknown> = {
      siteId,
      email: String(form.email ?? ""),
      shippingMethodId: shippingMethodId || undefined,
      couponCode: couponCode || undefined,
    };
    if (shippingAddressId) {
      body.shippingAddressId = shippingAddressId;
    } else {
      body.shippingAddress = { name, line1, city, postalCode, country };
    }

    if (saveAddress && !shippingAddressId && name && line1) {
      await fetch(`${apiUrl}/v1/storefront/addresses`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          siteId,
          label: "Home",
          name,
          line1,
          city,
          postalCode,
          country,
          isDefault: true,
        }),
      });
    }

    const res = await fetch(`${apiUrl}/v1/public/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return c.redirect("/checkout?error=1", 303);
    }
    const data = (await res.json()) as { order: { publicId: string } };
    return c.redirect(`/order/${encodeURIComponent(data.order.publicId)}`, 303);
  });

  app.post("/actions/track-order", async (c) => {
    const form = await c.req.parseBody();
    const siteId = String(form.siteId ?? "");
    const email = String(form.email ?? "");
    const orderPublicId = String(form.orderPublicId ?? "");
    const res = await fetch(`${apiUrl}/v1/public/orders/lookup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteId, email, orderPublicId }),
    });
    if (!res.ok) {
      return c.redirect("/orders/track?error=1", 303);
    }
    const data = (await res.json()) as {
      order: {
        publicId: string;
        status: string;
        currency: string;
        totalCents: number;
        carrier?: string | null;
        trackingNumber?: string | null;
        events?: Array<{ type: string; message: string; createdAt: string }>;
      };
    };
    const payload = Buffer.from(JSON.stringify(data.order), "utf8").toString(
      "base64url",
    );
    c.header(
      "set-cookie",
      `mx_track_flash=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=120`,
      { append: true },
    );
    return c.redirect("/orders/track?found=1", 303);
  });

  app.post("/actions/request-return", async (c) => {
    const form = await c.req.parseBody();
    const siteId = String(form.siteId ?? "");
    const publicId = String(form.publicId ?? "");
    const reason = String(form.reason ?? "");
    const rawItems = form.returnItem;
    const itemsJson: Array<Record<string, unknown>> = [];
    const pushItem = (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === "object") itemsJson.push(parsed);
      } catch {
        /* ignore malformed checkbox values */
      }
    };
    if (Array.isArray(rawItems)) {
      for (const item of rawItems) pushItem(String(item));
    } else if (rawItems != null && rawItems !== "") {
      pushItem(String(rawItems));
    }
    const cookie = c.req.header("cookie") ?? "";
    const res = await fetch(
      `${apiUrl}/v1/storefront/orders/${encodeURIComponent(publicId)}/returns`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({
          siteId,
          reason,
          ...(itemsJson.length ? { itemsJson } : {}),
        }),
      },
    );
    const q = res.ok ? "return=1" : "return=error";
    return c.redirect(
      `/account/orders/${encodeURIComponent(publicId)}?${q}`,
      303,
    );
  });

  app.post("/actions/sign-up", async (c) => {
    const form = await c.req.parseBody();
    const cookie = c.req.header("cookie") ?? "";
    const siteId = String(form.siteId ?? "");
    const res = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        origin: process.env.WEB_ORIGIN ?? "http://localhost:3002",
      },
      body: JSON.stringify({
        email: String(form.email ?? ""),
        password: String(form.password ?? ""),
        name: String(form.name ?? ""),
      }),
    });
    if (!res.ok) {
      return c.redirect("/account/sign-up?error=1", 303);
    }
    forwardSetCookies(res, c);
    await fetch(
      `${apiUrl}/v1/storefront/me?siteId=${encodeURIComponent(siteId)}`,
      {
        headers: {
          cookie: [
            cookie,
            ...(res.headers.getSetCookie?.() ?? []).map((s) => s.split(";")[0]),
          ]
            .filter(Boolean)
            .join("; "),
        },
      },
    );
    return c.redirect("/account", 303);
  });

  app.post("/actions/sign-in", async (c) => {
    const form = await c.req.parseBody();
    const cookie = c.req.header("cookie") ?? "";
    const siteId = String(form.siteId ?? "");
    const res = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        origin: process.env.WEB_ORIGIN ?? "http://localhost:3002",
      },
      body: JSON.stringify({
        email: String(form.email ?? ""),
        password: String(form.password ?? ""),
      }),
    });
    if (!res.ok) {
      return c.redirect("/account/sign-in?error=1", 303);
    }
    forwardSetCookies(res, c);
    const mergedCookie = [
      cookie,
      ...(res.headers.getSetCookie?.() ?? []).map((s) => s.split(";")[0]),
    ]
      .filter(Boolean)
      .join("; ");
    await fetch(
      `${apiUrl}/v1/storefront/me?siteId=${encodeURIComponent(siteId)}`,
      { headers: { cookie: mergedCookie } },
    );
    return c.redirect("/account", 303);
  });

  app.post("/actions/sign-in-google", async (c) => {
    const form = await c.req.parseBody();
    const host = (c.req.header("host") ?? "localhost").split(":")[0]!;
    const proto = c.req.header("x-forwarded-proto") ?? "http";
    const callbackURL = `${proto}://${host}/account`;
    const res = await fetch(`${apiUrl}/api/auth/sign-in/social`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: process.env.WEB_ORIGIN ?? "http://localhost:3002",
      },
      body: JSON.stringify({
        provider: "google",
        callbackURL,
        newUserCallbackURL: callbackURL,
      }),
    });
    if (!res.ok) {
      return c.redirect("/account/sign-in?error=1", 303);
    }
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      return c.redirect(data.url, 303);
    }
    void form;
    return c.redirect("/account/sign-in?error=1", 303);
  });

  app.post("/actions/sign-in-apple", async (c) => {
    const form = await c.req.parseBody();
    const host = (c.req.header("host") ?? "localhost").split(":")[0]!;
    const proto = c.req.header("x-forwarded-proto") ?? "http";
    const callbackURL = `${proto}://${host}/account`;
    const res = await fetch(`${apiUrl}/api/auth/sign-in/social`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: process.env.WEB_ORIGIN ?? "http://localhost:3002",
      },
      body: JSON.stringify({
        provider: "apple",
        callbackURL,
        newUserCallbackURL: callbackURL,
      }),
    });
    if (!res.ok) {
      return c.redirect("/account/sign-in?error=1", 303);
    }
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      return c.redirect(data.url, 303);
    }
    void form;
    return c.redirect("/account/sign-in?error=1", 303);
  });

  app.post("/actions/sign-out", async (c) => {
    const cookie = c.req.header("cookie") ?? "";
    const res = await fetch(`${apiUrl}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        cookie,
        origin: process.env.WEB_ORIGIN ?? "http://localhost:3002",
      },
    });
    forwardSetCookies(res, c);
    return c.redirect("/", 303);
  });

  app.get("/actions/cart-json", async (c) => {
    const siteId = c.req.query("siteId") ?? "";
    const cookie = c.req.header("cookie") ?? "";
    if (!siteId || siteId === "local") {
      return c.json({ cart: { items: [], subtotalCents: 0 } });
    }
    const res = await fetch(
      `${apiUrl}/v1/public/cart?siteId=${encodeURIComponent(siteId)}`,
      { headers: { cookie } },
    );
    applySetCookieHeaders(c, res.headers.getSetCookie?.() ?? []);
    if (!res.ok) {
      return c.json({ cart: { items: [], subtotalCents: 0 } }, 502);
    }
    const data = (await res.json()) as {
      cart: { items: CartSummaryItem[]; subtotalCents: number };
    };
    return c.json(data);
  });

  app.post("/actions/update-cart-item", async (c) => {
    const form = await c.req.parseBody();
    const itemId = String(form.itemId ?? "");
    const quantity = Number(form.quantity ?? 0);
    const cookie = c.req.header("cookie") ?? "";
    const res = await fetch(
      `${apiUrl}/v1/public/cart/items/${encodeURIComponent(itemId)}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({ quantity }),
      },
    );
    applySetCookieHeaders(c, res.headers.getSetCookie?.() ?? []);
    const referer = c.req.header("referer");
    const redirectTo =
      referer && new URL(referer).pathname.startsWith("/") ? referer : "/cart";
    return c.redirect(redirectTo, 303);
  });

  app.get("/*", async (c) => {
    const hostHeader = c.req.header("host") ?? "localhost";
    const host = hostHeader.split(":")[0]!;
    const path = new URL(c.req.url).pathname;
    const origin = `https://${host}`;
    const cookie = c.req.header("cookie") ?? "";

    const kind = resolveHostKind({ host, sitesHostSuffix });
    let site = await resolveSite(host);

    if (!site) {
      if (devSiteId) {
        site = {
          id: devSiteId,
          name: "Local Store",
          slug: "local",
          defaultLocale: "en",
          seoDefaultTitle: "Local Store",
          seoDefaultDescription: "Ecommerce storefront powered by mestryx-platform",
          llmsIntro: "Local ecommerce storefront for mestryx-platform.",
        };
      } else {
        site = {
          id: "local",
          name: kind.kind === "platform_subdomain" ? kind.slug : "Demo Store",
          slug: kind.kind === "platform_subdomain" ? kind.slug : "local",
          defaultLocale: "en",
          seoDefaultTitle: "Demo Store",
          seoDefaultDescription: "Ecommerce storefront powered by mestryx-platform",
          llmsIntro: "Local ecommerce storefront for mestryx-platform.",
        };
      }
    }

    const locale = normalizeLocale(site.defaultLocale);

    if (path === "/") {
      let products: StoreProduct[] = [];
      const url = new URL(c.req.url);
      const categoryQ = url.searchParams.get("category");
      const searchQ = url.searchParams.get("q");
      const minPriceQ = url.searchParams.get("minPrice");
      const maxPriceQ = url.searchParams.get("maxPrice");
      const sortQ = url.searchParams.get("sort");
      const minPriceCents = priceEuroQueryToCents(minPriceQ);
      const maxPriceCents = priceEuroQueryToCents(maxPriceQ);
      const [menus, cart] = await Promise.all([
        loadMenus(site.id),
        loadCartSummary(site.id, cookie),
      ]);
      applySetCookieHeaders(c, cart.setCookies);
      if (site.id !== "local") {
        const params = new URLSearchParams();
        if (categoryQ) params.set("category", categoryQ);
        if (searchQ) params.set("q", searchQ);
        if (minPriceCents) params.set("minPrice", minPriceCents);
        if (maxPriceCents) params.set("maxPrice", maxPriceCents);
        if (sortQ) params.set("sort", sortQ);
        const qs = params.toString() ? `?${params.toString()}` : "";
        const data = await fetchJson<{ products: StoreProduct[] }>(
          `/v1/public/sites/${site.id}/products${qs}`,
        );
        products = data?.products ?? [];
      }
      const cats =
        site.id !== "local"
          ? ((
              await fetchJson<{
                categories: Array<{ name: string; slug: string }>;
              }>(`/v1/public/sites/${site.id}/categories`)
            )?.categories ?? [])
          : [];
      const banners =
        site.id !== "local"
          ? ((
              await fetchJson<{
                banners: Array<{
                  id: string;
                  title: string;
                  subtitle?: string | null;
                  imageUrl?: string | null;
                  href?: string | null;
                }>;
              }>(`/v1/public/sites/${site.id}/banners`)
            )?.banners ?? [])
          : [];
      return c.html(
        pageHtml(
          site,
          "/",
          origin,
          `${site.name} — Shop`,
          site.seoDefaultDescription ?? "Shop",
          createElement(HomePage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            description:
              site.seoDefaultDescription ??
              "Curated products. Fast checkout when payment is enabled.",
            products,
            categories: cats,
            categoryQ,
            searchQ,
            minPriceQ,
            maxPriceQ,
            sortQ,
            cartCount: cart.count,
            banners,
            headerNav: menus.header,
            footerNav: menus.footer,
          }),
        ),
      );
    }

    if (path.startsWith("/p/") && site.id !== "local") {
      const slug = decodeURIComponent(path.slice("/p/".length));
      const data = await fetchJson<{
        product: StoreProduct;
        variants?: Array<{
          id: string;
          sku: string;
          optionsJson: Record<string, string>;
          priceCents: number;
          stock: number;
          status: string;
        }>;
        media?: Array<{ id: string; url: string; alt: string | null }>;
      }>(`/v1/public/sites/${site.id}/products/${encodeURIComponent(slug)}`);
      if (!data?.product) return c.html(notFoundHtml(undefined, site.defaultLocale), 404);
      const p = data.product;
      const variants = data.variants ?? [];
      const media = data.media ?? [];
      const added = Boolean(new URL(c.req.url).searchParams.get("added"));
      const wish = Boolean(new URL(c.req.url).searchParams.get("wish"));
      const cart = await loadCartSummary(site.id, cookie);
      applySetCookieHeaders(c, cart.setCookies);
      return c.html(
        pageHtml(
          site,
          path,
          origin,
          p.seoTitle ?? p.name,
          p.seoDescription ?? p.description ?? p.name,
          createElement(ProductPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            product: p,
            variants,
            media,
            added,
            wish,
          }),
          productJsonLd(p, origin),
        ),
      );
    }

    if (path === "/cart" && site.id !== "local") {
      const cart = await loadCartSummary(site.id, cookie);
      applySetCookieHeaders(c, cart.setCookies);
      return c.html(
        pageHtml(
          site,
          "/cart",
          origin,
          `Cart — ${site.name}`,
          "Your cart",
          createElement(CartPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            items: cart.items,
            subtotalCents: cart.subtotalCents,
          }),
        ),
      );
    }

    if (path === "/wishlist" && site.id !== "local") {
      const url = new URL(c.req.url);
      const flash = url.searchParams.get("removed")
        ? ("removed" as const)
        : url.searchParams.get("cart")
          ? ("cart" as const)
          : null;
      const res = await fetch(
        `${apiUrl}/v1/public/wishlist?siteId=${encodeURIComponent(site.id)}`,
        { headers: { cookie } },
      );
      const data = res.ok
        ? ((await res.json()) as {
            items: Array<{
              productId: string;
              name: string;
              slug: string;
              priceCents: number;
              currency: string;
            }>;
          })
        : { items: [] };
      for (const sc of res.headers.getSetCookie?.() ?? []) {
        c.header("set-cookie", sc, { append: true });
      }
      const cart = await loadCartSummary(site.id, cookie);
      applySetCookieHeaders(c, cart.setCookies);
      return c.html(
        pageHtml(
          site,
          "/wishlist",
          origin,
          `Wishlist — ${site.name}`,
          "Wishlist",
          createElement(WishlistPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            items: data.items,
            flash,
          }),
        ),
      );
    }

    if (path === "/checkout" && site.id !== "local") {
      const err = Boolean(new URL(c.req.url).searchParams.get("error"));
      const [ship, me, cart] = await Promise.all([
        fetchJson<{
          methods: Array<{
            id: string;
            name: string;
            priceCents: number;
            currency: string;
          }>;
        }>(`/v1/public/sites/${site.id}/shipping?country=FR`),
        loadAccount(site.id, cookie),
        loadCartSummary(site.id, cookie),
      ]);
      applySetCookieHeaders(c, cart.setCookies);
      let addresses: SavedAddress[] = [];
      if (me) {
        const addrData = await fetchJson<{ addresses: SavedAddress[] }>(
          `/v1/storefront/addresses?siteId=${encodeURIComponent(site.id)}`,
          { headers: { cookie } },
        );
        addresses = addrData?.addresses ?? [];
      }
      return c.html(
        pageHtml(
          site,
          "/checkout",
          origin,
          `Checkout — ${site.name}`,
          "Checkout",
          createElement(CheckoutPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            cartItems: cart.items,
            subtotalCents: cart.subtotalCents,
            shippingMethods: ship?.methods ?? [],
            addresses,
            emailPrefill: me?.customer.email,
            signedIn: Boolean(me),
            error: err,
          }),
        ),
      );
    }

    if (path === "/orders/track" && site.id !== "local") {
      const url = new URL(c.req.url);
      const err = Boolean(url.searchParams.get("error"));
      const found = Boolean(url.searchParams.get("found"));
      let order: {
        publicId: string;
        status: string;
        currency: string;
        totalCents: number;
        carrier?: string | null;
        trackingNumber?: string | null;
        events?: Array<{ type: string; message: string; createdAt: string }>;
      } | null = null;
      if (found) {
        const match = cookie.match(/(?:^|;\s*)mx_track_flash=([^;]+)/);
        if (match?.[1]) {
          try {
            order = JSON.parse(
              Buffer.from(match[1], "base64url").toString("utf8"),
            ) as typeof order;
          } catch {
            order = null;
          }
        }
        c.header(
          "set-cookie",
          "mx_track_flash=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
          { append: true },
        );
      }
      const cart = await loadCartSummary(site.id, cookie);
      applySetCookieHeaders(c, cart.setCookies);
      return c.html(
        pageHtml(
          site,
          path,
          origin,
          `Track order — ${site.name}`,
          "Track your order",
          createElement(OrderTrackPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            error: err,
            order,
          }),
        ),
      );
    }

    if (path === "/account/sign-in" && site.id !== "local") {
      const err = Boolean(new URL(c.req.url).searchParams.get("error"));
      const [me, cart] = await Promise.all([
        loadAccount(site.id, cookie),
        loadCartSummary(site.id, cookie),
      ]);
      applySetCookieHeaders(c, cart.setCookies);
      if (me) return c.redirect("/account", 303);
      return c.html(
        pageHtml(
          site,
          path,
          origin,
          `Sign in — ${site.name}`,
          "Sign in",
          createElement(AccountSignInPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            // Unauthenticated: /me is null — soft-enable from env (mirrors API config).
            googleOAuth: Boolean(
              process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
            ),
            appleOAuth: Boolean(
              process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET,
            ),
            error: err,
          }),
        ),
      );
    }

    if (path === "/account/sign-up" && site.id !== "local") {
      const err = Boolean(new URL(c.req.url).searchParams.get("error"));
      const [me, cart] = await Promise.all([
        loadAccount(site.id, cookie),
        loadCartSummary(site.id, cookie),
      ]);
      applySetCookieHeaders(c, cart.setCookies);
      if (me) return c.redirect("/account", 303);
      return c.html(
        pageHtml(
          site,
          path,
          origin,
          `Sign up — ${site.name}`,
          "Create account",
          createElement(AccountSignUpPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            googleOAuth: Boolean(
              process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
            ),
            appleOAuth: Boolean(
              process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET,
            ),
            error: err,
          }),
        ),
      );
    }

    if (path === "/account" && site.id !== "local") {
      const [me, cart] = await Promise.all([
        loadAccount(site.id, cookie),
        loadCartSummary(site.id, cookie),
      ]);
      applySetCookieHeaders(c, cart.setCookies);
      if (!me) return c.redirect("/account/sign-in", 303);
      const ordersData = await fetchJson<{
        orders: Array<{
          publicId: string;
          status: string;
          currency: string;
          totalCents: number;
          createdAt: string;
        }>;
      }>(`/v1/storefront/orders?siteId=${encodeURIComponent(site.id)}`, {
        headers: { cookie },
      });
      const returnsData = await fetchJson<{
        returns: Array<{
          id: string;
          status: string;
          reason: string;
          createdAt: string;
          orderPublicId: string;
        }>;
      }>(`/v1/storefront/returns?siteId=${encodeURIComponent(site.id)}`, {
        headers: { cookie },
      });
      return c.html(
        pageHtml(
          site,
          path,
          origin,
          `Account — ${site.name}`,
          "Your account",
          createElement(AccountPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            customer: me.customer,
            orders: ordersData?.orders ?? [],
            returns: returnsData?.returns ?? [],
          }),
        ),
      );
    }

    if (path.startsWith("/account/orders/") && site.id !== "local") {
      const me = await loadAccount(site.id, cookie);
      if (!me) return c.redirect("/account/sign-in", 303);
      const publicId = decodeURIComponent(path.slice("/account/orders/".length));
      const returnQ = new URL(c.req.url).searchParams.get("return");
      const returnFlash =
        returnQ === "1" ? ("ok" as const) : returnQ === "error" ? ("error" as const) : null;
      const data = await fetchJson<{
        order: {
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
        items: Array<{
          id?: string;
          name: string;
          quantity: number;
          unitPriceCents: number;
        }>;
        events?: Array<{ type: string; message: string; createdAt: string }>;
      }>(
        `/v1/storefront/orders/${encodeURIComponent(publicId)}?siteId=${encodeURIComponent(site.id)}`,
        { headers: { cookie } },
      );
      const cart = await loadCartSummary(site.id, cookie);
      applySetCookieHeaders(c, cart.setCookies);
      return c.html(
        pageHtml(
          site,
          path,
          origin,
          `Order ${publicId}`,
          "Order detail",
          createElement(AccountOrderPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            publicId,
            order: data?.order,
            items: data?.items,
            events: data?.events,
            returnFlash,
          }),
        ),
      );
    }

    if (path.startsWith("/order/")) {
      const publicId = decodeURIComponent(path.slice("/order/".length));
      const [data, cart] = await Promise.all([
        fetchJson<{
          order: {
            publicId: string;
            status: string;
            email: string;
            currency: string;
            subtotalCents: number;
            shippingCents: number;
            taxCents: number;
            totalCents: number;
            carrier?: string | null;
            trackingNumber?: string | null;
          };
          events?: Array<{ type: string; message: string; createdAt: string }>;
        }>(`/v1/public/orders/${encodeURIComponent(publicId)}`),
        loadCartSummary(site.id, cookie),
      ]);
      applySetCookieHeaders(c, cart.setCookies);
      return c.html(
        pageHtml(
          site,
          path,
          origin,
          `Order ${publicId}`,
          "Order confirmation",
          createElement(OrderPage, {
            locale,
            siteId: site.id,
            siteName: site.name,
            cartCount: cart.count,
            publicId,
            order: data?.order,
            events: data?.events,
          }),
        ),
      );
    }

    let page: PublicPage | undefined;
    let isPreview = false;
    if (site.id !== "local") {
      const slug = path.replace(/^\//, "") || "home";
      const previewToken = new URL(c.req.url).searchParams.get("preview");
      const qs = previewToken
        ? `?preview=${encodeURIComponent(previewToken)}`
        : "";
      const data = await fetchJson<{ page: PublicPage; preview?: boolean }>(
        `/v1/public/sites/${site.id}/pages/${encodeURIComponent(slug)}${qs}`,
      );
      page = data?.page;
      isPreview = Boolean(data?.preview || previewToken);
      if (!page) return c.html(notFoundHtml(undefined, site.defaultLocale), 404);
    } else if (path === "/privacy" || path === "/terms" || path === "/legal") {
      page = {
        id: path.slice(1),
        slug: path.slice(1),
        title:
          path === "/privacy"
            ? "Privacy Policy"
            : path === "/terms"
              ? "Terms of Sale"
              : "Legal Notice",
        seoTitle: `${path.slice(1)} — ${site.name}`,
        seoDescription: "Draft legal page.",
        bodyJson: {
          markdown: "Configure legal pages in admin after connecting a site.",
        },
      };
    } else {
      return c.html(notFoundHtml(undefined, site.defaultLocale), 404);
    }

    const title = page?.seoTitle ?? page?.title ?? site.name;
    const description =
      page?.seoDescription ??
      site.seoDefaultDescription ??
      "Public SSR site with SEO and AI discovery surfaces.";
    const [menus, cart] = await Promise.all([
      loadMenus(site.id),
      loadCartSummary(site.id, cookie),
    ]);
    applySetCookieHeaders(c, cart.setCookies);

    return c.html(
      pageHtml(
        site,
        path,
        origin,
        title,
        description,
        createElement(CmsPageView, {
            locale,
          siteId: site.id,
          siteName: site.name,
          cartCount: cart.count,
          title: page?.title ?? site.name,
          bodyJson: page?.bodyJson as Record<string, unknown> | undefined,
          headerNav: menus.header,
          footerNav: menus.footer,
          preview: isPreview,
        }),
      ),
    );
  });

  return app;
}

const app = createWebApp();

const isVitest = Boolean(process.env.VITEST);
const isMain =
  !isVitest &&
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js"));

if (isMain) {
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Web SSR listening on http://localhost:${port}`);
  });
}

export default app;
