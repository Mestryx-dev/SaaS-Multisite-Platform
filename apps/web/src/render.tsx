import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import {
  chromeMessages,
  normalizeLocale,
  t,
  type Locale,
} from "./i18n/index.js";
import {
  escapeHtml,
  renderDocument,
  type PublicPage,
  type PublicSite,
} from "./seo.js";

const here = dirname(fileURLToPath(import.meta.url));
const tokensCssPath = resolve(here, "../../../packages/tokens/src/tokens.css");
const uiCssPathCompiled = resolve(
  here,
  "../../../packages/ui/dist/styles.css",
);
const uiCssPathSource = resolve(
  here,
  "../../../packages/ui/src/styles.components.css",
);
const storeChromeJsPath = resolve(here, "client/store-chrome.js");

const baseCss = `
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--background); background-image: var(--background-ambient); color: var(--foreground); font-family: var(--font-sans); }
  a { color: inherit; }
`;

/** Re-read on each page so `pnpm build:css` / chrome JS edits apply without restarting web. */
function readTokensCss(): string {
  return readFileSync(tokensCssPath, "utf8");
}

function readUiCss(): string {
  try {
    return readFileSync(uiCssPathCompiled, "utf8");
  } catch {
    return readFileSync(uiCssPathSource, "utf8");
  }
}

function readStoreChromeJs(): string {
  return readFileSync(storeChromeJsPath, "utf8");
}

export function renderStorePage(opts: {
  site: PublicSite;
  path: string;
  origin: string;
  title: string;
  description: string;
  element: ReactElement;
  jsonLd?: Record<string, unknown>;
  locale?: Locale;
}): string {
  const locale = opts.locale ?? normalizeLocale(opts.site.defaultLocale);
  const bodyHtml = renderToString(opts.element);
  return renderDocument({
    site: opts.site,
    page: {
      id: opts.path,
      slug: opts.path.replace(/^\//, "") || "home",
      title: opts.title,
      seoTitle: opts.title,
      seoDescription: opts.description,
      jsonLd: opts.jsonLd,
    },
    path: opts.path,
    origin: opts.origin,
    bodyHtml,
    theme: "storefront",
    showCookieConsent: true,
    locale,
    i18n: { locale, messages: chromeMessages(locale) },
    cookieLabels: {
      message: t(locale, "store.cookie.message"),
      accept: t(locale, "store.cookie.accept"),
      policyLink: t(locale, "store.cookie.policyLink"),
    },
    extraStyles: `${readTokensCss()}\n${readUiCss()}\n${baseCss}`,
    extraScripts: readStoreChromeJs(),
  });
}

export function notFoundHtml(
  message?: string,
  locale?: string | null,
): string {
  const loc = normalizeLocale(locale);
  const text = message ?? t(loc, "store.error.notFound");
  return `<!doctype html><html lang="${escapeHtml(loc)}"><body><h1>${escapeHtml(text)}</h1></body></html>`;
}

export type { PublicPage, PublicSite };
