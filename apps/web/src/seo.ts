import { normalizeThemeJson, themeToCssVars } from "./theme.js";

export type PublicSite = {
  id: string;
  name: string;
  slug: string;
  defaultLocale?: string | null;
  seoDefaultTitle?: string | null;
  seoDefaultDescription?: string | null;
  ogImageUrl?: string | null;
  llmsIntro?: string | null;
  cookieConsentEnabled?: boolean | null;
  cookiePolicyPath?: string | null;
  themeJson?: Record<string, unknown> | null;
  umamiWebsiteId?: string | null;
  umamiSrc?: string | null;
};

export type PublicPage = {
  id: string;
  slug: string;
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalPath?: string | null;
  robots?: string | null;
  bodyJson?: Record<string, unknown>;
  jsonLd?: Record<string, unknown> | null;
};

export function buildJsonLd(site: PublicSite, page?: PublicPage) {
  if (page?.jsonLd) return page.jsonLd;
  return {
    "@context": "https://schema.org",
    "@type": page ? "WebPage" : "WebSite",
    name: page?.seoTitle ?? page?.title ?? site.seoDefaultTitle ?? site.name,
    description:
      page?.seoDescription ??
      site.seoDefaultDescription ??
      `${site.name} — powered by mestryx-platform`,
  };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function umamiScriptTag(websiteId: string, src: string): string {
  return `<script defer src="${escapeHtml(src)}" data-website-id="${escapeHtml(websiteId)}"></script>`;
}

export function consentBannerHtml(
  policyPath: string,
  umami?: { websiteId: string; src: string } | null,
  labels?: {
    message: string;
    accept: string;
    policyLink: string;
  },
): string {
  const path = escapeHtml(policyPath || "/privacy");
  const umamiJson = umami
    ? JSON.stringify({ id: umami.websiteId, src: umami.src })
    : "null";
  const message = escapeHtml(
    labels?.message ??
      "We use essential cookies to run the shop. Analytics load after you accept. See our",
  );
  const accept = escapeHtml(labels?.accept ?? "Accept");
  const policyLink = escapeHtml(labels?.policyLink ?? "privacy policy");
  return `
<div id="mx-cookie-banner" hidden style="position:fixed;bottom:0;left:0;right:0;z-index:50;background:var(--background,#fff);border-top:1px solid var(--border,#ddd);padding:1rem 1.25rem;display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center;justify-content:space-between;font-size:0.875rem;">
  <p style="margin:0;max-width:40rem;">${message} <a href="${path}">${policyLink}</a>.</p>
  <button type="button" id="mx-cookie-accept" style="border:1px solid var(--border,#ddd);padding:0.5rem 1rem;cursor:pointer;background:transparent;">${accept}</button>
</div>
<script>
(function(){
  try {
    var key = "mx_cookie_consent";
    var umami = ${umamiJson};
    function loadUmami(){
      if (!umami || !umami.id || !umami.src) return;
      if (document.querySelector('script[data-website-id="'+umami.id+'"]')) return;
      var s = document.createElement("script");
      s.defer = true;
      s.src = umami.src;
      s.setAttribute("data-website-id", umami.id);
      document.head.appendChild(s);
    }
    if (document.cookie.split(";").some(function(c){ return c.trim().indexOf(key+"=")===0; })) {
      loadUmami();
      return;
    }
    var el = document.getElementById("mx-cookie-banner");
    if (!el) return;
    el.hidden = false;
    el.style.display = "flex";
    document.getElementById("mx-cookie-accept")?.addEventListener("click", function(){
      document.cookie = key + "=1;path=/;max-age=31536000;samesite=lax";
      el.remove();
      loadUmami();
    });
  } catch (e) {}
})();
</script>`;
}

export function renderDocument(opts: {
  site: PublicSite;
  page?: PublicPage;
  path: string;
  origin: string;
  bodyHtml: string;
  extraStyles?: string;
  extraScripts?: string;
  theme?: "platform" | "storefront";
  showCookieConsent?: boolean;
  locale?: string;
  i18n?: { locale: string; messages: Record<string, string> };
  cookieLabels?: { message: string; accept: string; policyLink: string };
}): string {
  const title = escapeHtml(
    opts.page?.seoTitle ??
      opts.page?.title ??
      opts.site.seoDefaultTitle ??
      opts.site.name,
  );
  const description = escapeHtml(
    opts.page?.seoDescription ??
      opts.site.seoDefaultDescription ??
      `${opts.site.name} — mestryx-platform`,
  );
  const canonical = escapeHtml(
    `${opts.origin}${opts.page?.canonicalPath ?? opts.path}`,
  );
  const ogImage = escapeHtml(opts.page?.ogImageUrl ?? opts.site.ogImageUrl ?? "");
  const robots = escapeHtml(opts.page?.robots ?? "index,follow");
  const jsonLd = JSON.stringify(buildJsonLd(opts.site, opts.page));
  const theme = opts.theme ?? "storefront";
  const themeCss = themeToCssVars(normalizeThemeJson(opts.site.themeJson ?? null));
  const styles = `${opts.extraStyles ?? ""}\n${themeCss}`;
  const lang = escapeHtml(opts.locale ?? "en");

  const storeThemeKey = `mx-store-theme:${opts.site.id}`;
  const storeThemeBoot =
    theme === "storefront"
      ? `<script>(function(){try{var k=${JSON.stringify(storeThemeKey)};var s=localStorage.getItem(k);if(s!=="dark")return;var t="storefront-dark";var apply=function(){document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme="dark";if(document.body)document.body.setAttribute("data-theme",t);};apply();if(!document.body)document.addEventListener("DOMContentLoaded",apply);}catch(e){}})();</script>`
      : "";

  const platformSrc =
    process.env.UMAMI_SCRIPT_URL?.trim() ||
    opts.site.umamiSrc?.trim() ||
    "";
  const websiteId =
    opts.site.umamiWebsiteId?.trim() ||
    process.env.UMAMI_WEBSITE_ID?.trim() ||
    "";
  const umamiCfg =
    websiteId && platformSrc
      ? { websiteId, src: platformSrc }
      : null;

  const consentEnabled =
    opts.showCookieConsent !== false &&
    opts.site.cookieConsentEnabled !== false;

  let consent = "";
  let headUmami = "";
  if (consentEnabled) {
    consent = consentBannerHtml(
      opts.site.cookiePolicyPath ?? "/privacy",
      umamiCfg,
      opts.cookieLabels,
    );
  } else if (umamiCfg) {
    headUmami = umamiScriptTag(umamiCfg.websiteId, umamiCfg.src);
  }

  const i18nBoot = opts.i18n
    ? `<script>window.__MX_I18N__=${JSON.stringify(opts.i18n)};</script>`
    : "";

  return `<!doctype html>
<html lang="${lang}" data-theme="${theme}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <!-- F-11: same faces as @mestryx/tokens/fonts (IBM Plex Sans + Fraunces); Google CDN for Hono SSR until self-host bundle. -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${jsonLd}</script>
  <style>${styles}</style>
  ${headUmami}
</head>
<body data-theme="${theme}">
  ${storeThemeBoot}
  ${opts.bodyHtml}
  ${consent}
  ${i18nBoot}
  ${opts.extraScripts ? `<script>${opts.extraScripts}</script>` : ""}
</body>
</html>`;
}
