---
version: alpha
name: mestryx-platform
description: Three product surfaces — platform admin (Mestryx Teal), marketing landing (NYC Night), storefront shop (light). Lock from packages/tokens.
colors:
  platform-bg: "#0b0f14"
  platform-fg: "#e2e8f0"
  platform-muted: "#94a3b8"
  platform-accent: "#5eead4"
  platform-border: "#334155"
  platform-danger: "#e06c75"
  platform-warning: "#e8b84a"
  platform-surface: "#0f172a"
  platform-elevated: "#0f172a"
  platform-on-accent: "#0b0f14"
  marketing-bg: "#07080d"
  marketing-fg: "#f5f3ef"
  marketing-muted: "#9ca3af"
  marketing-accent: "#c9a227"
  marketing-border: "#252a3a"
  marketing-surface: "#10131c"
  marketing-on-accent: "#07080d"
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

mestryx-platform uses **three product themes** via `data-theme`:

- **platform** — Mestryx Teal admin console (stage `#0b0f14`, teal accent `#5eead4`, Inter UI + Plus Jakarta Sans display, 8px radius, chrome glass). Companion `platform-light` uses `#115e59` on paper. See ADR-0006.
- **marketing** — NYC Night product landing (stage `#07080d`, gold accent `#c9a227`, same Inter + Plus Jakarta, ambient wash + header glass). See ADR-0008.
- **storefront** — light shop (Fraunces display + IBM Plex body, **Soft boutique** 8px radius, green accent `#2f5d3a`).

Values match `packages/tokens`. Storefront universal base = Studio-derived light palette; **Luna** uses preset `luna`. Marketing product name remains deferred; avoid Piblox branding on this product.

## Colors

Semantic CSS variables use **shadcn names** (`--background`, `--primary`, …) under `data-theme` — see [docs/design-system/shadcn-css-variables.md](./docs/design-system/shadcn-css-variables.md). Front matter labels map to those roles.

**Platform accent** is Mestryx Teal (ADR-0006), not lilac / purple gradient meshes. **Marketing accent** is night-gold NYC Night (ADR-0008). **Ops status:** green for success only; warning amber OKLCH ≈ `oklch(0.72 0.12 75)` — not brand accent.

## Typography

**Platform (admin):** Inter (400–700) for UI/tables; **Plus Jakarta Sans** (500–700) for page titles and KPI values via `--font-display`.  
**Marketing landing:** same Inter + Plus Jakarta as platform (ADR-0002); color surface is NYC Night (ADR-0008).  
**Storefront:** IBM Plex Sans body + Fraunces display/hero. Do not use Inter or Plus Jakarta on the shop.

## Layout

Spacing scale 8 / 16 / 24. Prefer density for admin tables; generous rhythm for storefront PDP.

**Soft boutique** — storefront cards avoid heavy boxed borders; rounded media (`var(--radius)`), subtle hover lift (~200ms), and muted category pills instead of sharp boxed chrome.

**Chrome glass** — translucent blur on:

- **Platform:** utilities top bar uses `.glass-chrome` (`--glass-*`, no floating shadow). Page title lives only in **PageHeader**. Never glass on table cells, primary form inputs, or solid primary CTAs.
- **Marketing:** sticky site header uses glass tokens (`--glass-bg`, `--glass-blur`). Never glass on solid primary CTAs or demo screenshot frames.
- **Storefront:** sticky header, PLP toolbar, cart drawer/overlay. Never on product media, hero photos, or solid primary CTAs.

**Ambient page wash** — static CSS `--background-ambient` (teal/slate radials on stage) so frosted chrome has something to blur through. No animated mesh under product grids.

**Vitrine homepage** — `/` is a boutique window (full-bleed hero, collection tiles, curated featured rail). Price filters and sort live only on **catalog** views.

## Elevation & Depth

Surfaces via `--card` / `--secondary` — no nested card stacks for decoration. KPI strips use a single bordered surface with `gap-px` cells. Platform elevated = sidebar `#0f172a`.

## Components

Shared atoms in `packages/ui`. Patterns tagged platform | storefront | shared. Motion via package `motion` with reduced-motion respect.

## Motion

Intentional enter/exit and feedback only. See `docs/design-system/motion-guidelines.md`.
