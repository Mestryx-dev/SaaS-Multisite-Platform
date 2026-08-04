# @mestryx/remotion

Promo / marketing videos (Remotion **4.0.489**).

## Architecture

| Surface | What runs |
|---------|-----------|
| **Storefront / admin** | Live UI code (React + design-system motion). **No** Remotion Player, **no** MP4 embeds in the shop path. |
| **This app** | Composition source of truth (Studio for iterate). |
| **CI render** | Export **MP4** artifacts for **social / ads** (Instagram, TikTok, Reels, creatives). |

## Compositions

| ID | Purpose | Theme |
|----|---------|-------|
| `MestryxPromo` | Quick brand bumper | platform |
| `ProductPromo` | Catalog product ads (image + name + price) | storefront |
| `BrandLaunch` | External launch / platform communication | platform |

## Commands

```bash
pnpm --filter @mestryx/remotion studio
pnpm --filter @mestryx/remotion render:product
pnpm --filter @mestryx/remotion render:brand
pnpm --filter @mestryx/remotion render:all   # all three MP4s
# or: pnpm render:remotion:all
```

Root aliases: `pnpm dev:remotion` · `pnpm render:remotion` · `pnpm render:remotion:all`

Output: `apps/remotion/out/` (gitignored).

## CI (FB-092)

Workflow job: **`remotion`** in `.github/workflows/ci.yml` (parallel to `monorepo`).

1. `remotion browser ensure`
2. typecheck
3. `ci:render` (= `render:all`)
4. Upload artifact **`remotion-promos`** (`apps/remotion/out/*.mp4`, 7-day retention)

Download MP4s from the Actions run when you need social creatives.
