# Site theming (N-site / Shopify-like)

**Last updated:** 2026-07-19  
**Related:** [shadcn-css-variables.md](./shadcn-css-variables.md) · `@mestryx/tokens/presets`

## Model

| Layer | What | Where |
|-------|------|--------|
| 1 Lexicon | shadcn CSS var names | Universal (all surfaces + sites) |
| 2 Surface defaults | `platform` / `storefront` | `packages/tokens/src/tokens.css` |
| 3 Presets | Named palettes (`luna`, `storefront-base`, …) | `packages/tokens/src/presets/` |
| 4 Site overrides | `site.theme_json` v2 | DB + admin Sites page |

**Do not** create one CSS file per merchant site. Add a preset + seed instead.

```text
resolve(preset) → merge tokens overrides → themeToCssVars → :root inject on storefront
```

## themeJson v2

```json
{
  "version": 2,
  "preset": "luna",
  "tokens": { "primary": "oklch(0.5 0.1 40)" },
  "fontSans": "IBM Plex Sans, sans-serif",
  "logoUrl": "https://…"
}
```

- Colors: HEX or `oklch()` / `rgb()` / `hsl()`.
- Legacy v1 and Luna seed `{ accent, background }` normalize to v2.

## Built-in presets

| Id | Role |
|----|------|
| `storefront-base` | Universal shop light (Studio `:root` OKLCH) |
| `luna` | Luna Bijoux (same Studio light + Fraunces) |
| `storefront-dark` | Catalog only (Studio `.dark`) — not default for Luna |
| `platform` | Admin console (Mestryx dark) — catalog / surface default |

## Add a new site brand (e.g. 3D print)

1. Copy `packages/tokens/src/presets/luna.ts` → `print3d.ts` with new OKLCH values.
2. Register in `presets/index.ts` + `THEME_PRESET_IDS` in `types.ts`.
3. Seed `themeJson: { version: 2, preset: "print3d" }`.
4. Offer in admin via `listSitePresets()` (omit `catalogOnly: true`).

No changes to `tokens.css` lexicon or app CSS architecture required.

## Luna

Seed sets `preset: "luna"`. Storefront SSR injects full resolved CSS vars when `themeJson` has a preset.
