# Shadcn CSS variables (runtime lexicon)

**Last updated:** 2026-07-19  
**SSOT values:** [`packages/tokens/src/tokens.css`](../../packages/tokens/src/tokens.css)  
**Tailwind bridge:** [`packages/ui/src/styles.css`](../../packages/ui/src/styles.css)

Runtime theme tokens use **native shadcn/ui CSS variable names**. Dual product themes stay on `data-theme="platform"` | `"storefront"` (not only `:root` / `.dark`).

## Rules

1. Do **not** introduce new `--mx-*` semantic color vars.
2. Do **not** paste a full Shadcn Studio theme CSS blob (fonts / `:root`+`.dark` only) over this package.
3. Values are **OKLCH** for surface defaults + presets (HEX still accepted in overrides).
4. Site brands use **presets** (`themeJson.v2`) — see [site-theming.md](./site-theming.md). Tenant overrides may set any lexicon key.

## Core set (both themes)

| Variable | Role |
|----------|------|
| `--background` / `--foreground` | Page canvas + body text |
| `--card` / `--card-foreground` | Elevated surface |
| `--popover` / `--popover-foreground` | Floating surfaces |
| `--primary` / `--primary-foreground` | Brand interactive |
| `--secondary` / `--secondary-foreground` | Secondary fill |
| `--muted` / `--muted-foreground` | Quiet fill + secondary text |
| `--accent` / `--accent-foreground` | Hover / highlight fill |
| `--destructive` | Danger |
| `--border` / `--input` / `--ring` | Chrome + focus |
| `--radius` | Base radius (platform `8px`, storefront `0`) |
| `--chart-1` … `--chart-5` | Charts |
| `--sidebar` … `--sidebar-ring` | Admin shell sidebar |

`@theme inline` in `packages/ui` maps these to `--color-*` / `--radius-*` for Tailwind utilities (`bg-background`, `text-primary`, …).

## Mestryx extensions (allowed)

| Variable | Role |
|----------|------|
| `--font-sans` | UI / body (IBM Plex Sans) |
| `--font-display` | Storefront display (Fraunces); platform = same as sans |
| `--flash-bg` / `--flash-border` | Soft callout / alert flash surfaces |

## JS mirror

[`packages/tokens/src/index.ts`](../../packages/tokens/src/index.ts) exports `platformTokens` / `storefrontTokens` with shadcn-aligned keys (`color.background`, `color.primary`, `fontSans`, …) for Remotion and non-CSS consumers.

## Agent pointer

Skill **`mestryx-design-system`**: runtime lexicon = this doc. Conflict rule unchanged — `PRODUCT.md` / `DESIGN.md` / tokens win for values.
