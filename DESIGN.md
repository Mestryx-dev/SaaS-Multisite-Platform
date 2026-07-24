---
version: alpha
name: mestryx-platform
description: Dual-theme product UI — platform admin (night-gold) and storefront shop (light). Lock from packages/tokens.
colors:
  platform-bg: "#07080d"
  platform-fg: "#f5f3ef"
  platform-muted: "#9ca3af"
  platform-accent: "#c9a227"
  platform-border: "#252a3a"
  platform-danger: "#b91c1c"
  platform-warning: "#e8b84a"
  platform-surface: "#10131c"
  platform-elevated: "#0b0d14"
  platform-on-accent: "#1a1608"
  storefront-bg: "#f4f0e8"
  storefront-fg: "#1a1f16"
  storefront-muted: "#5c6554"
  storefront-accent: "#2f5d3a"
  storefront-border: "#d9d2c4"
  storefront-danger: "#b42318"
  storefront-surface: "#fffdf8"
  storefront-on-accent: "#f7fff8"
typography:
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  display-storefront:
    fontFamily: Fraunces
    fontSize: 2.25rem
    fontWeight: 600
    lineHeight: 1.15
  display-platform:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.2
  body-storefront:
    fontFamily: IBM Plex Sans
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  platform: 8px
  storefront: 8px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary-platform:
    backgroundColor: "{colors.platform-accent}"
    textColor: "{colors.platform-on-accent}"
    rounded: "{rounded.platform}"
    padding: 12px
  button-primary-storefront:
    backgroundColor: "{colors.storefront-accent}"
    textColor: "{colors.storefront-on-accent}"
    rounded: "{rounded.storefront}"
    padding: 12px
---

## Overview

mestryx-platform uses **two product themes** via `data-theme`:

- **platform** — night-gold admin console (deep night `#07080d`, gold accent `#c9a227`, Inter UI + Plus Jakarta Sans display, 8px radius, chrome glass).
- **storefront** — light shop (Fraunces display + IBM Plex body, **Soft boutique** 8px radius, green accent `#2f5d3a`).

Values match `packages/tokens` (OKLCH). Storefront universal base = Studio-derived light palette; **Luna** uses preset `luna`. Marketing product name remains deferred; avoid Piblox violet.

## Colors

Semantic CSS variables use **shadcn names** (`--background`, `--primary`, …) under `data-theme` — see [docs/design-system/shadcn-css-variables.md](./docs/design-system/shadcn-css-variables.md). Front matter labels map to those roles. Do not introduce purple gradients.

**Ops status:** green for success only; warning amber OKLCH ≈ `oklch(0.72 0.12 75)` — not brand gold.

## Typography

**Platform (admin):** Inter (400–700) for UI/tables; **Plus Jakarta Sans** (500–700) for page titles and KPI values via `--font-display`.  
**Storefront:** IBM Plex Sans body + Fraunces display/hero. Do not use Inter or Plus Jakarta on the shop.

## Layout

Spacing scale 8 / 16 / 24. Prefer density for admin tables; generous rhythm for storefront PDP.

**Soft boutique** — storefront cards avoid heavy boxed borders; rounded media (`var(--radius)`), subtle hover lift (~200ms), and muted category pills instead of sharp boxed chrome.

**Chrome glass** — translucent blur on:

- **Platform:** utilities top bar + sidebar brand row use `.glass-chrome` (`--glass-*`, no floating shadow). Page title lives only in **PageHeader** (shell top bar must not duplicate the page name). Never glass on table cells, primary form inputs, or solid gold CTAs.
- **Storefront:** sticky header, PLP toolbar, cart drawer/overlay. Never on product media, hero photos, or solid primary CTAs.

**Ambient page wash** — static CSS `--background-ambient` (soft gold + cool radials on night canvas) so frosted chrome has something to blur through. No animated mesh under product grids.

**Vitrine homepage** — `/` is a boutique window (full-bleed hero, collection tiles, curated featured rail). Price filters and sort live only on **catalog** views.

## Elevation & Depth

Surfaces via `--card` / `--secondary` — no nested card stacks for decoration. KPI strips use a single bordered surface with `gap-px` cells.

## Components

Shared atoms in `packages/ui`. Patterns tagged platform | storefront | shared. Motion via package `motion` with reduced-motion respect.

## Motion

Intentional enter/exit and feedback only. See `docs/design-system/motion-guidelines.md`.
