import { z } from "zod";
import {
  isThemePresetId,
  resolveThemeFromJson,
  themeTokensToCssVars,
  type ThemeJsonV2,
  type ThemePresetId,
  type ThemeTokenMap,
} from "@mestryx/tokens/presets";

export const MODULE_IDS = ["cms", "commerce"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export const modulesAllowedSchema = z.array(z.enum(MODULE_IDS)).min(1);

const colorValue = z
  .string()
  .min(1)
  .max(120)
  .refine(
    (v) =>
      /^#[0-9a-fA-F]{3,8}$/.test(v) ||
      /^oklch\(/i.test(v) ||
      /^rgb\(/i.test(v) ||
      /^hsl\(/i.test(v),
    { message: "Expected hex, oklch(), rgb(), or hsl()" },
  );

const themeTokenPartialSchema = z
  .record(z.string(), z.string().max(200))
  .optional();

export const themeJsonSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]).default(2),
  preset: z
    .enum(["platform", "storefront-base", "luna", "storefront-dark"])
    .optional(),
  tokens: themeTokenPartialSchema,
  logoUrl: z.string().url().optional().or(z.literal("")),
  fontSans: z.string().max(120).optional(),
  fontDisplay: z.string().max(120).optional(),
  fontFamily: z.string().max(120).optional(),
  radius: z.string().max(32).optional(),
  mood: z.string().max(80).optional(),
  primaryColor: colorValue.optional(),
  accentColor: colorValue.optional(),
  backgroundColor: colorValue.optional(),
});

export type ThemeJsonV1Compat = z.infer<typeof themeJsonSchema>;

export type { ThemeJsonV2, ThemePresetId, ThemeTokenMap };

/** Normalize legacy Luna seed, v1, and v2 payloads → ThemeJsonV2. */
export function normalizeThemeJson(
  raw: Record<string, unknown> | null | undefined,
): ThemeJsonV2 | null {
  if (!raw || typeof raw !== "object") return null;

  if (raw.version === 2 || raw.preset || raw.tokens) {
    const parsed = themeJsonSchema.safeParse({ version: 2, ...raw });
    if (!parsed.success) return null;
    const d = parsed.data;
    const tokens: Partial<ThemeTokenMap> = {
      ...(d.tokens as Partial<ThemeTokenMap> | undefined),
    };
    if (d.primaryColor) tokens.primary = d.primaryColor;
    if (d.accentColor) tokens.accent = d.accentColor;
    if (d.backgroundColor) tokens.background = d.backgroundColor;
    return {
      version: 2,
      preset: d.preset,
      tokens: Object.keys(tokens).length ? tokens : undefined,
      logoUrl: d.logoUrl || undefined,
      fontSans: d.fontSans ?? d.fontFamily,
      fontDisplay: d.fontDisplay,
      radius: d.radius,
      mood: d.mood,
    };
  }

  if (raw.version === 1 || "primaryColor" in raw || "logoUrl" in raw) {
    const parsed = themeJsonSchema.safeParse({ version: 1, ...raw });
    if (!parsed.success) return null;
    const d = parsed.data;
    const tokens: Partial<ThemeTokenMap> = {};
    if (d.primaryColor) tokens.primary = d.primaryColor;
    if (d.accentColor) tokens.accent = d.accentColor;
    if (d.backgroundColor) tokens.background = d.backgroundColor;
    return {
      version: 2,
      preset: "storefront-base",
      tokens: Object.keys(tokens).length ? tokens : undefined,
      logoUrl: d.logoUrl || undefined,
      fontSans: d.fontSans ?? d.fontFamily,
      mood: d.mood,
    };
  }

  // Legacy seed shape { accent, background, mood }
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

export function themeToCssVars(
  theme: ThemeJsonV2 | null,
  defaultPreset: ThemePresetId = "storefront-base",
): string {
  if (!theme) return "";
  const resolved = resolveThemeFromJson(theme, defaultPreset);
  // Only emit when site has explicit branding (preset or overrides)
  const hasBrand =
    Boolean(theme.preset) ||
    Boolean(theme.tokens && Object.keys(theme.tokens).length) ||
    Boolean(theme.fontSans) ||
    Boolean(theme.fontDisplay) ||
    Boolean(theme.radius);
  if (!hasBrand) return "";
  return themeTokensToCssVars(resolved.tokens, ":root");
}

export { isThemePresetId, resolveThemeFromJson, themeTokensToCssVars };
