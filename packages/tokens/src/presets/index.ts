import { lunaPreset } from "./luna.js";
import { marketingPreset } from "./marketing.js";
import { platformPreset } from "./platform.js";
import { storefrontBasePreset } from "./storefront-base.js";
import { storefrontDarkPreset } from "./storefront-dark.js";
import {
  THEME_PRESET_IDS,
  TOKEN_TO_CSS_VAR,
  type ThemeJsonV2,
  type ThemePresetId,
  type ThemePresetMeta,
  type ThemeTokenMap,
} from "./types.js";

export * from "./types.js";
export { storefrontBaseTokens } from "./storefront-base.js";
export { platformTokensMap } from "./platform.js";
export { marketingTokensMap } from "./marketing.js";
export { storefrontDarkTokens } from "./storefront-dark.js";

const PRESETS: Record<ThemePresetId, ThemePresetMeta> = {
  platform: platformPreset,
  marketing: marketingPreset,
  "storefront-base": storefrontBasePreset,
  luna: lunaPreset,
  "storefront-dark": storefrontDarkPreset,
};

export function listPresets(opts?: {
  includeCatalogOnly?: boolean;
}): ThemePresetMeta[] {
  const includeCatalog = opts?.includeCatalogOnly ?? false;
  return THEME_PRESET_IDS.map((id) => PRESETS[id]).filter(
    (p) => includeCatalog || !p.catalogOnly,
  );
}

export function getPreset(id: ThemePresetId): ThemePresetMeta {
  return PRESETS[id];
}

export function isThemePresetId(value: unknown): value is ThemePresetId {
  return (
    typeof value === "string" &&
    (THEME_PRESET_IDS as readonly string[]).includes(value)
  );
}

/** Merchant-facing presets for site theme picker. */
export function listSitePresets(): ThemePresetMeta[] {
  return listPresets({ includeCatalogOnly: false });
}

export type ResolvedTheme = {
  presetId: ThemePresetId;
  tokens: ThemeTokenMap;
  logoUrl?: string;
};

export function resolveTheme(input: {
  preset?: ThemePresetId | string | null;
  tokens?: Partial<ThemeTokenMap> | null;
  logoUrl?: string;
  fontSans?: string;
  fontDisplay?: string;
  radius?: string;
  /** Fallback when preset missing. */
  defaultPreset?: ThemePresetId;
}): ResolvedTheme {
  const defaultPreset = input.defaultPreset ?? "storefront-base";
  const presetId = isThemePresetId(input.preset) ? input.preset : defaultPreset;
  const base = { ...getPreset(presetId).tokens };
  const overlay = input.tokens ?? {};
  const merged: ThemeTokenMap = { ...base, ...overlay };
  if (input.fontSans) merged.fontSans = input.fontSans;
  if (input.fontDisplay) merged.fontDisplay = input.fontDisplay;
  if (input.radius) merged.radius = input.radius;
  return {
    presetId,
    tokens: merged,
    logoUrl: input.logoUrl,
  };
}

export function resolveThemeFromJson(
  json: ThemeJsonV2 | null | undefined,
  defaultPreset: ThemePresetId = "storefront-base",
): ResolvedTheme {
  if (!json) {
    return resolveTheme({ defaultPreset });
  }
  return resolveTheme({
    preset: json.preset,
    tokens: json.tokens,
    logoUrl: json.logoUrl,
    fontSans: json.fontSans,
    fontDisplay: json.fontDisplay,
    radius: json.radius,
    defaultPreset,
  });
}

/** Emit full CSS custom-property block for injection. */
export function themeTokensToCssVars(
  tokens: ThemeTokenMap,
  selector = ":root",
): string {
  const parts: string[] = [];
  for (const key of Object.keys(TOKEN_TO_CSS_VAR) as (keyof ThemeTokenMap)[]) {
    const cssVar = TOKEN_TO_CSS_VAR[key];
    const value = tokens[key];
    if (value === undefined || value === "") continue;
    if (key === "colorScheme") {
      parts.push(`color-scheme: ${value}`);
    } else {
      parts.push(`${cssVar}: ${value}`);
    }
  }
  if (parts.length === 0) return "";
  return `${selector} { ${parts.join("; ")}; }`;
}
