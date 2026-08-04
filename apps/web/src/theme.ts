import {
  resolveThemeFromJson,
  themeTokensToCssVars,
  type ThemeJsonV2,
  type ThemePresetId,
  type ThemeTokenMap,
} from "@mestryx/tokens/presets";

export type ThemeJsonV1 = {
  version: 1 | 2;
  preset?: ThemePresetId;
  tokens?: Partial<ThemeTokenMap>;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSans?: string;
  fontDisplay?: string;
  backgroundColor?: string;
  radius?: string;
  mood?: string;
};

export type { ThemeJsonV2 };

export function normalizeThemeJson(
  raw: Record<string, unknown> | null | undefined,
): ThemeJsonV2 | null {
  if (!raw || typeof raw !== "object") return null;

  if (raw.version === 2 || raw.preset || raw.tokens) {
    const tokens: Partial<ThemeTokenMap> = {
      ...((raw.tokens as Partial<ThemeTokenMap>) ?? {}),
    };
    if (typeof raw.primaryColor === "string") tokens.primary = raw.primaryColor;
    if (typeof raw.accentColor === "string") tokens.accent = raw.accentColor;
    if (typeof raw.backgroundColor === "string") {
      tokens.background = raw.backgroundColor;
    }
    return {
      version: 2,
      preset: raw.preset as ThemePresetId | undefined,
      tokens: Object.keys(tokens).length ? tokens : undefined,
      logoUrl: typeof raw.logoUrl === "string" ? raw.logoUrl : undefined,
      fontSans:
        typeof raw.fontSans === "string"
          ? raw.fontSans
          : typeof raw.fontFamily === "string"
            ? raw.fontFamily
            : undefined,
      fontDisplay:
        typeof raw.fontDisplay === "string" ? raw.fontDisplay : undefined,
      radius: typeof raw.radius === "string" ? raw.radius : undefined,
      mood: typeof raw.mood === "string" ? raw.mood : undefined,
    };
  }

  if (raw.version === 1 || "primaryColor" in raw || "logoUrl" in raw) {
    const tokens: Partial<ThemeTokenMap> = {};
    if (typeof raw.primaryColor === "string") tokens.primary = raw.primaryColor;
    if (typeof raw.accentColor === "string") tokens.accent = raw.accentColor;
    if (typeof raw.backgroundColor === "string") {
      tokens.background = raw.backgroundColor;
    }
    return {
      version: 2,
      preset: "storefront-base",
      tokens: Object.keys(tokens).length ? tokens : undefined,
      logoUrl: typeof raw.logoUrl === "string" ? raw.logoUrl : undefined,
      fontSans:
        typeof raw.fontSans === "string"
          ? raw.fontSans
          : typeof raw.fontFamily === "string"
            ? raw.fontFamily
            : undefined,
      mood: typeof raw.mood === "string" ? raw.mood : undefined,
    };
  }

  const accent = typeof raw.accent === "string" ? raw.accent : undefined;
  const background =
    typeof raw.background === "string" ? raw.background : undefined;
  const mood = typeof raw.mood === "string" ? raw.mood : undefined;
  if (!accent && !background && !mood) return null;
  const tokens: Partial<ThemeTokenMap> = {};
  if (accent) {
    tokens.primary = accent;
    tokens.accent = accent;
  }
  if (background) tokens.background = background;
  return {
    version: 2,
    preset: "luna",
    tokens: Object.keys(tokens).length ? tokens : undefined,
    mood,
  };
}

export function themeToCssVars(theme: ThemeJsonV2 | null): string {
  if (!theme) return "";
  const hasBrand =
    Boolean(theme.preset) ||
    Boolean(theme.tokens && Object.keys(theme.tokens).length) ||
    Boolean(theme.fontSans) ||
    Boolean(theme.fontDisplay) ||
    Boolean(theme.radius);
  if (!hasBrand) return "";
  const resolved = resolveThemeFromJson(theme, "storefront-base");
  return themeTokensToCssVars(resolved.tokens, ":root");
}
