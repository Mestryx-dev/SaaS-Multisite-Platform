import { eq } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import { site } from "../../db/schema.js";
import en from "./locales/en.json" with { type: "json" };
import fr from "./locales/fr.json" with { type: "json" };

export type EmailLocale = "en" | "fr";

type Dictionary = Record<string, string>;

const catalogs: Record<EmailLocale, Dictionary> = {
  en: en as Dictionary,
  fr: fr as Dictionary,
};

export function normalizeEmailLocale(
  value: string | null | undefined,
): EmailLocale {
  const raw = (value ?? "en").trim().toLowerCase();
  if (raw === "fr" || raw.startsWith("fr-")) return "fr";
  return "en";
}

export function getEmailDictionary(locale: EmailLocale): Dictionary {
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

/** Translate a flat email key. Missing keys fall back to EN, then the key itself. */
export function emailT(
  locale: EmailLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = getEmailDictionary(locale)[key];
  if (primary !== undefined) return interpolate(primary, vars);
  const fallback = catalogs.en[key];
  if (fallback !== undefined) return interpolate(fallback, vars);
  return key;
}

export async function resolveSiteEmailLocale(
  db: Db,
  siteId: string,
): Promise<EmailLocale> {
  const [row] = await db
    .select({ defaultLocale: site.defaultLocale })
    .from(site)
    .where(eq(site.id, siteId))
    .limit(1);
  return normalizeEmailLocale(row?.defaultLocale);
}
