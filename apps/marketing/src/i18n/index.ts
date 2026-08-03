import en from "./en.json" with { type: "json" };
import fr from "./fr.json" with { type: "json" };

export type Locale = "fr" | "en";

/** Flat dotted message keys — English paths, locale-specific values. */
export type MessageKey = keyof typeof en;

type Dictionary = Record<MessageKey, string>;

const catalogs: Record<Locale, Dictionary> = {
  en: en as Dictionary,
  fr: fr as Dictionary,
};

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALES: readonly Locale[] = ["fr", "en"] as const;

export function normalizeLocale(value: string | null | undefined): Locale {
  const raw = (value ?? DEFAULT_LOCALE).trim().toLowerCase();
  if (raw === "fr" || raw.startsWith("fr-")) return "fr";
  if (raw === "en" || raw.startsWith("en-")) return "en";
  return DEFAULT_LOCALE;
}

/** Full message catalog for a locale. */
export function getMessages(locale: Locale): Dictionary {
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
 * Translate a flat marketing key. Missing keys fall back to EN, then the key itself.
 */
export function t(
  locale: Locale,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const primary = getMessages(locale)[key];
  if (primary !== undefined) return interpolate(primary, vars);
  const fallback = catalogs.en[key];
  if (fallback !== undefined) return interpolate(fallback, vars);
  return key;
}
