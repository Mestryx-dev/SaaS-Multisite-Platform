---
version: alpha
name: mestryx-platform
description: Dual-theme product UI — platform admin (Obsidian Soft) and storefront shop (light). Lock from packages/tokens.
colors:
  platform-bg: "#19191c"
  platform-fg: "#e6e6ea"
  platform-muted: "#9a9aa3"
  platform-accent: "#a78bfa"
  platform-border: "#34343d"
  platform-danger: "#e06c75"
  platform-warning: "#e8b84a"
  platform-surface: "#232328"
  platform-elevated: "#131316"
  platform-on-accent: "#120f1c"
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

- **platform** — Obsidian Soft admin console (graphite `#19191c`, soft lilac accent `#a78bfa`, Inter UI + Plus Jakarta Sans display, 8px radius, chrome glass). Companion `platform-light` for daytime ops.
- **storefront** — light shop (Fraunces display + IBM Plex body, **Soft boutique** 8px radius, green accent `#2f5d3a`).

Values match `packages/tokens`. Storefront universal base = Studio-derived light palette; **Luna** uses preset `luna`. Marketing product name remains deferred; avoid Piblox branding on this product.

## Colors

Semantic CSS variables use **shadcn names** (`--background`, `--primary`, …) under `data-theme` — see [docs/design-system/shadcn-css-variables.md](./docs/design-system/shadcn-css-variables.md). Front matter labels map to those roles.

**Platform accent** is soft lilac (ADR-0005), not neon purple gradient meshes. **Ops status:** green for success only; warning amber OKLCH ≈ `oklch(0.72 0.12 75)` — not brand accent.

## Typography

**Platform (admin):** Inter (400–700) for UI/tables; **Plus Jakarta Sans** (500–700) for page titles and KPI values via `--font-display`.  
**Storefront:** IBM Plex Sans body + Fraunces display/hero. Do not use Inter or Plus Jakarta on the shop.

## Layout

Spacing scale 8 / 16 / 24. Prefer density for admin tables; generous rhythm for storefront PDP.

**Soft boutique** — storefront cards avoid heavy boxed borders; rounded media (`var(--radius)`), subtle hover lift (~200ms), and muted category pills instead of sharp boxed chrome.

**Chrome glass** — translucent blur on:

- **Platform:** utilities top bar uses `.glass-chrome` (`--glass-*`, no floating shadow). Page title lives only in **PageHeader**. Never glass on table cells, primary form inputs, or solid primary CTAs.
- **Storefront:** sticky header, PLP toolbar, cart drawer/overlay. Never on product media, hero photos, or solid primary CTAs.

**Ambient page wash** — static CSS `--background-ambient` (soft lilac radials on graphite) so frosted chrome has something to blur through. No animated mesh under product grids.

**Vitrine homepage** — `/` is a boutique window (full-bleed hero, collection tiles, curated featured rail). Price filters and sort live only on **catalog** views.

## Elevation & Depth

Surfaces via `--card` / `--secondary` — no nested card stacks for decoration. KPI strips use a single bordered surface with `gap-px` cells. Platform elevated = sidebar `#131316`.

## Components

Shared atoms in `packages/ui`. Patterns tagged platform | storefront | shared. Motion via package `motion` with reduced-motion respect.

## Motion

Intentional enter/exit and feedback only. See `docs/design-system/motion-guidelines.md`.
