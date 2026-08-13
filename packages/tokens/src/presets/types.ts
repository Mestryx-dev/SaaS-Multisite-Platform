/** Site / surface theme token map (shadcn CSS var lexicon + Mestryx extensions). */

export const THEME_PRESET_IDS = [
  "platform",
  "marketing",
  "storefront-base",
  "luna",
  "storefront-dark",
] as const;

export type ThemePresetId = (typeof THEME_PRESET_IDS)[number];

export type ThemeTokenMap = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  radius: string;
  fontSans: string;
  fontDisplay: string;
  flashBg: string;
  flashBorder: string;
  shadow2xs: string;
  shadowXs: string;
  shadowSm: string;
  shadow: string;
  shadowMd: string;
  shadowLg: string;
  shadowXl: string;
  shadow2xl: string;
  colorScheme: "light" | "dark";
};

/** Maps ThemeTokenMap keys → CSS custom property names. */
export const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokenMap, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
  radius: "--radius",
  fontSans: "--font-sans",
  fontDisplay: "--font-display",
  flashBg: "--flash-bg",
  flashBorder: "--flash-border",
  shadow2xs: "--shadow-2xs",
  shadowXs: "--shadow-xs",
  shadowSm: "--shadow-sm",
  shadow: "--shadow",
  shadowMd: "--shadow-md",
  shadowLg: "--shadow-lg",
  shadowXl: "--shadow-xl",
  shadow2xl: "--shadow-2xl",
  colorScheme: "color-scheme",
};

export type ThemePresetMeta = {
  id: ThemePresetId;
  label: string;
  /** When true, catalog-only (not offered as default storefront seed). */
  catalogOnly?: boolean;
  tokens: ThemeTokenMap;
};

export type ThemeJsonV2 = {
  version: 2;
  preset?: ThemePresetId;
  tokens?: Partial<ThemeTokenMap>;
  logoUrl?: string;
  fontSans?: string;
  fontDisplay?: string;
  radius?: string;
  /** Free-form merchant notes (ignored by resolver). */
  mood?: string;
};

/** Shared light shadow scale (Studio). */
export const SHADOWS_LIGHT = {
  shadow2xs: "0 1px 3px 0px oklch(0.00 0 0 / 0.05)",
  shadowXs: "0 1px 3px 0px oklch(0.00 0 0 / 0.05)",
  shadowSm:
    "0 1px 3px 0px oklch(0.00 0 0 / 0.10), 0 1px 2px -1px oklch(0.00 0 0 / 0.10)",
  shadow:
    "0 1px 3px 0px oklch(0.00 0 0 / 0.10), 0 1px 2px -1px oklch(0.00 0 0 / 0.10)",
  shadowMd:
    "0 1px 3px 0px oklch(0.00 0 0 / 0.10), 0 2px 4px -1px oklch(0.00 0 0 / 0.10)",
  shadowLg:
    "0 1px 3px 0px oklch(0.00 0 0 / 0.10), 0 4px 6px -1px oklch(0.00 0 0 / 0.10)",
  shadowXl:
    "0 1px 3px 0px oklch(0.00 0 0 / 0.10), 0 8px 10px -1px oklch(0.00 0 0 / 0.10)",
  shadow2xl: "0 1px 3px 0px oklch(0.00 0 0 / 0.25)",
} as const;
