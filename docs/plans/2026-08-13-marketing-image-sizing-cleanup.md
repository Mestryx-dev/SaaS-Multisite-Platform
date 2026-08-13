# Marketing image sizing + cookie banner cleanup

**Date:** 2026-08-13  
**Branch:** `dev`  
**Status:** Done locally (awaiting push OK)

## Problem

Demo screenshots in `apps/marketing` rendered as tall unreadable strips. HTML `width`/`height` attributes set intrinsic height (`900` / `844`) while CSS `aspect-ratio` lacked `height: auto`, so the used height ignored the ratio. Combined with `object-fit: cover`, Admin/Vitrine were heavily cropped.

Measured before (desktop 1440): admin **349×900**, phone **136×844**. After: admin **349×261** (≈4:3), phone **136×294** (≈390/844).

## Fix

- [`apps/marketing/src/styles/global.css`](../../apps/marketing/src/styles/global.css): `height: auto`, `max-width: 100%`, `object-fit: contain`, viewport `max-height` caps on ProductStage + stage-panel images
- Phone chrome wrapper in [`ProductStage.astro`](../../apps/marketing/src/components/ProductStage.astro); correct store intrinsic attrs in stage panels
- Cookie banner repositioned to **bottom-start** so it does not overlap `.product-stage__frame`

## How to edit the cookie banner copy

Edit both locale catalogs (keep parity):

| UI string | Key |
|-----------|-----|
| Title | `cookies.banner.preferences` |
| Body | `cookies.banner.message` |
| Accept analytics | `cookies.banner.acceptAnalytics` |
| Necessary only | `cookies.banner.necessaryOnly` |

Files: [`apps/marketing/src/i18n/fr.json`](../../apps/marketing/src/i18n/fr.json), [`apps/marketing/src/i18n/en.json`](../../apps/marketing/src/i18n/en.json).  
Component: [`CookieBanner.astro`](../../apps/marketing/src/components/CookieBanner.astro).

Consent storage key: `localStorage.mx-consent-analytics` (`1` / `0`).

## Commits

1. `fix(marketing): restore demo image aspect ratios with contain`
2. `fix(marketing): move cookie banner off product stage`
3. This docs note

## Verify

- Playwright ratios at 1440 / 768 / 390 within ±2% of 1.333 and 0.462
- Banner vs stage: no bounding-box overlap on desktop
- `pnpm --filter @mestryx/marketing typecheck`
