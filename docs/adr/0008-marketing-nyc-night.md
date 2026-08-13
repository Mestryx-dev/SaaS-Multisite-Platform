# ADR-0008: Marketing NYC Night surface

**Status**: Accepted  
**Date**: 2026-08-13  
**Related**: [ADR-0006](./0006-platform-mestryx-teal.md) (admin Mestryx Teal remains), [ADR-0003](./0003-platform-night-gold-glass.md) (historical night-gold)

## Context

ADR-0006 aligned **admin + marketing** to Mestryx Teal. Product direction now wants the public marketing landing (`apps/marketing`) to use the **NYC Night** night-gold look already live on sibling Mestryx surfaces (portfolio dark theme, motion factory `nycNight`), while the admin console stays Mestryx Teal.

## Decision Drivers

1. Distinctive product landing (night stage + gold CTAs) without retinting the admin tool.
2. Reuse a verified token map (bg `#07080d`, surface `#10131c`, gold `#c9a227`) already documented for night-gold / NYC Night.
3. Keep storefront Soft boutique / Luna unchanged.
4. Avoid foreign product brand names in user-facing marketing copy.

## Considered Options

1. Keep marketing on `data-theme="platform"` (teal) — rejected (landing identity request).
2. Retint admin to night-gold again — rejected (ADR-0006 admin lock).
3. **New `data-theme="marketing"` NYC Night** — chosen.

## Decision Outcome

- Marketing landing uses `[data-theme="marketing"]` in `packages/tokens` + preset `marketing` (catalog-only).
- Admin continues on Mestryx Teal (`platform` / `platform-light`) per ADR-0006.
- Marketing chrome: ambient wash + sticky header glass (`--glass-*`); solid CTAs stay dark-on-gold (`--primary-foreground: #07080d`).
- Public docs name the surface **NYC Night** / night-gold — not third-party product brands.

## Consequences

- DESIGN.md / brand-brief document three surfaces: platform, storefront, marketing.
- ADR-0006 still governs **admin** color; its marketing-share statement is superseded **for the landing only** by this ADR.
- Local marketing CSS must use theme variables (no hardcoded Mestryx Teal hex).
