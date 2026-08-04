/** JS mirrors + re-exports for theme presets. */

export {
  getPreset,
  isThemePresetId,
  listPresets,
  listSitePresets,
  platformTokensMap,
  resolveTheme,
  resolveThemeFromJson,
  storefrontBaseTokens,
  storefrontDarkTokens,
  themeTokensToCssVars,
  THEME_PRESET_IDS,
  TOKEN_TO_CSS_VAR,
} from "./presets/index.js";

export type {
  ResolvedTheme,
  ThemeJsonV2,
  ThemePresetId,
  ThemePresetMeta,
  ThemeTokenMap,
} from "./presets/index.js";

import { platformTokensMap } from "./presets/platform.js";
import { storefrontBaseTokens } from "./presets/storefront-base.js";

/** @deprecated Prefer resolveTheme / getPreset — kept for Remotion. */
export const platformTokens = {
  color: {
    background: platformTokensMap.background,
    foreground: platformTokensMap.foreground,
    muted: platformTokensMap.muted,
    mutedForeground: platformTokensMap.mutedForeground,
    primary: platformTokensMap.primary,
    primaryForeground: platformTokensMap.primaryForeground,
    secondary: platformTokensMap.secondary,
    secondaryForeground: platformTokensMap.secondaryForeground,
    accent: platformTokensMap.accent,
    accentForeground: platformTokensMap.accentForeground,
    destructive: platformTokensMap.destructive,
    border: platformTokensMap.border,
    card: platformTokensMap.card,
    cardForeground: platformTokensMap.cardForeground,
    flashBg: platformTokensMap.flashBg,
    flashBorder: platformTokensMap.flashBorder,
  },
  radius: platformTokensMap.radius,
  fontSans: platformTokensMap.fontSans,
  fontDisplay: platformTokensMap.fontDisplay,
} as const;

/** @deprecated Prefer getPreset("storefront-base") / resolveTheme. */
export const storefrontTokens = {
  color: {
    background: storefrontBaseTokens.background,
    foreground: storefrontBaseTokens.foreground,
    muted: storefrontBaseTokens.muted,
    mutedForeground: storefrontBaseTokens.mutedForeground,
    primary: storefrontBaseTokens.primary,
    primaryForeground: storefrontBaseTokens.primaryForeground,
    secondary: storefrontBaseTokens.secondary,
    secondaryForeground: storefrontBaseTokens.secondaryForeground,
    accent: storefrontBaseTokens.accent,
    accentForeground: storefrontBaseTokens.accentForeground,
    destructive: storefrontBaseTokens.destructive,
    border: storefrontBaseTokens.border,
    card: storefrontBaseTokens.card,
    cardForeground: storefrontBaseTokens.cardForeground,
    flashBg: storefrontBaseTokens.flashBg,
    flashBorder: storefrontBaseTokens.flashBorder,
  },
  radius: storefrontBaseTokens.radius,
  fontSans: storefrontBaseTokens.fontSans,
  fontDisplay: storefrontBaseTokens.fontDisplay,
} as const;

/** @deprecated Prefer platformTokens */
export const tokens = platformTokens;
