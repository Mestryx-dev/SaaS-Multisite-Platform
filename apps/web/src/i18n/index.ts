import en from "./locales/en.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };

export type Locale = "en" | "fr";

type Dictionary = Record<string, string>;

const catalogs: Record<Locale, Dictionary> = {
  en: en as Dictionary,
  fr: fr as Dictionary,
};

/** Keys injected into `window.__MX_I18N__.messages` for store-chrome.js */
export const CHROME_MESSAGE_KEYS = [
  "store.cart.loading",
  "store.cart.empty",
  "store.cart.emptyCta",
  "store.cart.error",
  "store.cart.subtotal",
  "store.cart.view",
  "store.cart.unavailable",
  "store.cart.quantity",
  "store.cart.update",
  "store.cart.remove",
  "store.nav.themeDark",
  "store.nav.themeLight",
] as const;

export function normalizeLocale(value: string | null | undefined): Locale {
  const raw = (value ?? "en").trim().toLowerCase();
  if (raw === "fr" || raw.startsWith("fr-")) return "fr";
  return "en";
}

export function getDictionary(locale: Locale): Dictionary {
  return catalogs[locale] ?? catalogs.en;
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const v = vars[name];
    return v === undefined || v === null ? `{{${name}}}` : String(v);
  });
}

/**
 * Translate a flat store key. Missing keys fall back to EN, then the key itself.
 */
export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = getDictionary(locale)[key];
  if (primary !== undefined) return interpolate(primary, vars);
  const fallback = catalogs.en[key];
  if (fallback !== undefined) return interpolate(fallback, vars);
  return key;
}

/** Subset of messages for the cart island (`store-chrome.js`). */
export function chromeMessages(locale: Locale): Dictionary {
  const out: Dictionary = {};
  for (const key of CHROME_MESSAGE_KEYS) {
    out[key] = t(locale, key);
  }
  return out;
}
