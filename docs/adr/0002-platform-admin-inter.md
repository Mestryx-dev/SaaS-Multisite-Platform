# ADR-0002: Platform admin typeface — Inter

**Status**: Accepted  
**Date**: 2026-07-22

## Context

Admin console typography used IBM Plex Sans (DESIGN.md lock). Dense dark UI felt hard to read; medium/semibold hierarchy was weak compared to Dokploy (`dokploy.mestryx.dev`), which ships **Inter** via `next/font` (`--font-inter`).

Storefront brand voice remains distinct (IBM Plex + Fraunces). PRODUCT.md previously discouraged Inter as a *generic SaaS brand* default for marketing/shop — not as an ops-console choice.

## Decision Drivers

1. Dense admin readability (tables, nav, badges).
2. True weights 400 / 500 / 600 / 700 (Dokploy hierarchy uses `font-medium` / `font-semibold`).
3. Align shell polish with Dokploy without copying green/OLED palette.
4. Keep storefront identity unchanged.

## Considered Options

1. Keep IBM Plex — add missing weights only (already had 400/600/700).
2. **Inter for platform only** (Dokploy family).
3. Geist / system-ui stack.

## Decision Outcome

Chosen **option 2**: platform theme `--font-sans` / `--font-display` = Inter (self-hosted `@fontsource/inter` 400–700). Storefront keeps IBM Plex Sans + Fraunces. DESIGN.md updated accordingly.

## Consequences

- Admin + Storybook platform stories load Inter; reload required after font CSS change.
- Checklist “no Inter” carve-out: Inter allowed on **platform** only; still forbidden as storefront/marketing brand face.
- Web SSR Google Fonts link stays Plex+Fraunces (storefront).
