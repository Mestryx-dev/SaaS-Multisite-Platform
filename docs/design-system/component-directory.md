# Component directory (platform × storefront)

**Last updated:** 2026-07-24  
**Status:** Storefront Soft boutique + Soft glass chrome + commerce patterns; platform form layout + Stalwart-inspired list chrome (dark); admin fluid console width.  
**Related:** [stack-and-tooling.md](./stack-and-tooling.md) · [ux-ui-harmony-checklist.md](./ux-ui-harmony-checklist.md)

---

## Shared atoms / molecules

Storybook: each atom under `Components/` has an **Autodocs** page (`tags: ["autodocs"]`) with ArgsTable + Show/Copy code. Patterns and Foundations do **not** use autodocs.

Platform console layout patterns (Wave A+): `PageContent`, `TableFrame`, `SplitLayout`, `FilterChips`, `DensityToggle`, `BulkActionBar` — see [admin-console-master-plan.md](./admin-console-master-plan.md) and Storybook **Patterns/ConsoleLayout**. UX polish + Stalwart harvest (2026-07-22): EmptyState icon/CTA, ListPanel, SearchField, ActionTile, Alert warning, RouteFade. **Dokploy cleanliness** (2026-07-22): flat AppShell nav, ListPanel list pages, surface `/60`, Button `inverse`. **Fluid width** (2026-07-24): `PageContent` `wide`/`full` fill the AppShell main column (no `max-w-7xl`); `SplitLayout` `listDetail` for Sites; `FormPanel` default `xl`. **Unified header** (2026-07-25): AppShell full-bleed sticky bar (`--app-header-height`); sidebar below.

| Name | Status | Path |
|------|--------|------|
| Button | shadcn-style (CVA) | `primary` \| `secondary` \| `ghost` \| `destructive` \| `outline` \| `inverse` |
| Input / Label / Textarea | shadcn-style | `components/*` |
| Select | native select + Tailwind | `components/select.tsx` |
| Checkbox / Switch / RadioGroup | Radix | `components/*` |
| EmptyState / Text / Muted | shadcn-style | EmptyState: `icon` / `title` / `description` / `action` / `variant` |
| SearchField | platform | Lucide search + optional pill |
| Card / Stack / Alert | shadcn-style | Alert: `error` \| `info` \| `warning` + title/dismiss |
| StatusDot / MetaPill | platform | Dokploy-inspired status + top meta |
| Badge | shadcn-style | pill; `default` \| `success` \| `danger` \| `muted` \| `info` |
| Table / DataTable | shadcn + lightweight pattern | `components/table.tsx`, `data-table.tsx` |
| Separator / Skeleton / Avatar | shadcn-style; Skeleton `pulse` \| `shimmer` | `components/*` |
| Spinner | circular loading indicator | `components/spinner.tsx` |
| Dialog / Sheet / Popover | Radix | `components/*` |
| Tabs / Tooltip / DropdownMenu | Radix | `components/*` |
| Breadcrumb / Pagination | shadcn-style | PaginationPrevNext cluster |
| Command (cmdk) | Dialog + cmdk | `components/command.tsx` |
| Toast (Sonner) | themed Toaster | `components/toast.tsx` |
| Progress / Accordion / ScrollArea | Radix | `components/*` |
| KpiBullet | platform KPI progress | `components/kpi-bullet.tsx` |
| MotionPresence / MotionPress / RouteFade | motion | `patterns/motion/` |

## Patterns

| Name | Locked Storybook theme | Status |
|------|------------------------|--------|
| AppShell / NavLink / NavSection / AuthShell | `platform` | grouped IA + density |
| FormPanel / FormField / FormRow / FormActions | `platform` | default panel `xl`; `full` for Sites settings |
| PageHeader / FilterBar / StatStrip / Dropzone | `platform` | harvested — StatStrip optional `bullet` |
| PageContent / TableFrame / SplitLayout | `platform` | fluid `wide`/`full`; SplitLayout `formAside` \| `listDetail` |
| ListPanel | `platform` | Stalwart list chrome (header + body + footer) |
| ActivityList | `platform` | Dokploy recent activity / deploy rows |
| ActionTile / ActionTileGrid | `platform` | maintenance / tools action cards |
| FilterChips / DensityToggle / BulkActionBar | `platform` | table UX (Wave B) |
| TableSkeleton / FormSkeleton / PageSkeleton / LoadingBlock / LoadingOverlay | `platform` | loading system (`patterns/loading.tsx`) |
| **Patterns/Loading** (Storybook) | `platform` (+ storefront proof) | table · form · page · block · overlay |
| **Patterns/ConsoleLayout** (Storybook) | `platform` | List · Settings · Split templates |
| StoreHeader / ProductCard / StoreHero / StoreFooter | `storefront` | Soft boutique + Soft glass header; hero `variant=vitrine` |
| **Storefront/Vitrine** (Storybook) | `storefront` | Full e-com walk: home → PLP → PDP → checkout (+ Soft glass) |
| CollectionCard / CollectionGrid / StoreSection | `storefront` | Vitrine home (collections + featured) |
| PriceDisplay / TrustStrip / ProductGallery | `storefront` | PDP commerce surfaces |
| PlpToolbar / PriceRangeInputs | `storefront` | Soft glass PLP chrome (not auth-form width) |
| CartLine / CartDrawer / CheckoutLayout / OrderSummary | `storefront` | Soft glass drawer; open via web island (`is-open`) |
| DataTable (+ FilterBar toolbar) | `platform` | Storybook Orders demo |
| Card `panel` \| `ghost` | both | anti nesting |

**Form layout sizes:** FormPanel `md`/`lg`/`xl`/`full` → panel max-width; FormField `sm`/`md`/`lg`/`full` → control cap (`max-w-xs` … `w-full`). Inputs stay `w-full` of the field. Story: **Patterns/FormLayout**.

**Storefront Soft boutique:** image-first ProductCard; CartDrawer SSR + `store-chrome.js`. Presentation: **Storefront/Vitrine** · commerce building blocks: **Storefront/Commerce**.

Atoms and Foundations default to **Vitrine** (`storefront`). Platform stories pin `globals.theme` via `.storybook/theme.ts`.

## Storybook

Run: `pnpm --filter @mestryx/ui storybook`. Default theme toolbar = **Vitrine (e-commerce)**. Blank white canvas after long HMR → restart; details in [stack-and-tooling.md](./stack-and-tooling.md#storybook-blank-canvas).

Colocated stories: **Storefront/** (vitrine walk) · `Foundations/` · `Components/` (Autodocs) · `Patterns/` (admin). Dual-theme proof: **Foundations/Themes → SideBySide**. Open any atom → **Docs** for Show/Copy code.

## Fonts

Self-hosted via `@mestryx/tokens/fonts` (**Inter** platform + IBM Plex Sans + Fraunces storefront) in Storybook + admin. Web SSR uses Google Fonts CDN for **storefront** faces (`seo.ts`) until font assets are bundled into the web dist.
