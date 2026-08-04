import { LOCALES, type Locale, normalizeLocale } from "../i18n";

export function localeStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale } }));
}

export function resolveLocale(param: string | undefined): Locale {
  return normalizeLocale(param);
}
