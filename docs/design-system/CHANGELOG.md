# Design system changelog

Traceability for FB-037 / design-system milestones. Newest first.

## 2026-07-25 (Unified AppShell header)

- **AppShell:** LMB-style full-bleed sticky header (`--app-header-height: 3.5rem` on platform). Brand + collapse + utilities share one bar; sidebar starts below (no separate brand row height mismatch).
- **Admin shell:** user + EN/FR + light/dark toggle live in the top bar only; sidebar footer removed (no duplicate chip). `platform-light` token companion + `admin-theme` localStorage.
- Wave E Soft glass still deferred — chrome classes unchanged.

## 2026-07-24 (Admin console width / density)

- **PageContent:** `wide`/`full` are fluid (no `max-w-7xl`); default PageContent prop is `wide`. Admin pages use `full`.
- **SplitLayout:** `variant="listDetail"` (narrow list rail + wide settings) vs default `formAside`.
- **FormPanel:** default width `xl` (`max-w-4xl`); Sites settings use `full` + multi-col FormRow.
- **AppShell:** main padding `md:p-6 xl:px-8` for fluid canvases.
- Reading: SaaS admin density (Linear/Vercel) — fill main column, not marketing max-width.

## 2026-07-24 (Store Soft boutique polish — FB-102)

- **Patterns:** `CheckoutSteps`; CartLine / CategoryNav / PriceRange / TrustStrip / header chrome accept locale props (no EN hardcode at runtime).
- **Gallery:** active thumb state (`data-active`); drawer cart lines parity with `CartLine` + focus trap.
- **Pages:** Soft cart summary layout, wishlist grid, checkout fieldsets + shipping radios, PDP qty.
- Storybook: Commerce stories remain EN demo defaults.

## 2026-07-23 (Platform chrome flatten)

- **Shell top bar** = utilities only (Cmd+K, Sign in primary button) — no page-name crumb duplicating PageHeader.
- **`.glass-chrome`**: brand row + top bar share glass tokens without floating-card shadow.
- **PageHeader**: `--font-display` title + section-style eyebrow; EmptyState panel uses quieter `card/40`.
- Storefront Soft boutique unchanged.

## 2026-07-23 (Platform night-gold + chrome glass)

- **Tokens:** platform theme rewritten to deep night + gold primary (`#c9a227` OKLCH); `--glass-*`, `--glow-accent`, `--primary-muted`.
- **Fonts:** Plus Jakarta Sans (500–700) as `--font-display`; Inter remains UI/tables. Storefront unchanged (Plex + Fraunces).
- **Chrome glass:** `.glass-panel` / `.glass-card` / type-kpi utilities; AppShell top bar + sidebar brand row.
- **Atoms:** Button primary solid gold + soft glow; StatStrip shared-surface `gap-px` layout; nav active gold tint; denser table `py-1.5`; sticky thead glass.
- ADR: [0003-platform-night-gold-glass.md](../adr/0003-platform-night-gold-glass.md). DESIGN.md lock updated.

## 2026-07-22 (Impeccable coherence wave)

- **Adapt:** AppShell hides desktop aside on mobile; left `Sheet` nav; touch-friendly menu control.
- **Workspace:** `WorkspaceProvider` + shell org switcher (localStorage); Orders/Products/Members/Menus/Dashboard share active org.
- **Clarify:** Human order/product/menu status labels (i18n EN/FR); removed MetaPill “Local”.
- **Distill:** Dashboard = inbox when orgs exist (create org progressive); Orders saved-views collapsed; Badge-only status (no StatusDot+Badge double).
- **Polish:** DESIGN.md documents warning amber OKLCH.

## 2026-07-22 (Platform typeface — Inter)

- **Platform admin** switches to **Inter** (400/500/600/700) — same family as Dokploy ops UI (`--font-inter` on dokploy.mestryx.dev).
- Storefront unchanged: IBM Plex Sans + Fraunces.
- ADR: [0002-platform-admin-inter.md](../adr/0002-platform-admin-inter.md). Tokens: `packages/tokens` fonts + platform preset.

## 2026-07-22 (Dokploy cleanliness wave)

- **Shell / AppShell:** Dokploy-flat nav — static uppercase group labels; per-link Lucide icons; **Commerce** alone collapsible (`defaultOpen={false}` + auto-open when active). Sidebar width `14.5rem` / collapse rail `3.5rem`. Quiet top bar: breadcrumb left, Cmd+K + MetaPill right; session-aware Sign in; footer user + org + EN/FR.
- **Menus proof:** single `ListPanel` + Header|Footer `TabsList variant="pills"` + `EmptyState variant="plain"`; FormPanel aside. Storybook `Patterns/ListPanel` Menus-like.
- **Surfaces:** TableFrame / ListPanel / ActivityList `bg-card/60`; EmptyState `panel` solid border (optional `dashed`); Button `variant="inverse"` for page-level CTAs.
- **Lists:** Orders / Products / Members on ListPanel + SearchField; StatusDot + Badge tones on order/product status columns.
- Accent stays platform blue (`DESIGN.md`); green only for ops status.

## 2026-07-22 (Dokploy-inspired harvest — dark platform)

- **StatusDot** — ok / warn / danger / idle / info (a11y label required).
- **ActivityList** — recent activity rows (dot + title/subtitle + meta + trailing).
- **MetaPill** — top-bar capsule (local time / meta).
- **StatStrip** — larger value, optional `trend` + `footer` (status breakdown).
- **Badge** — pill shape; tones `success` (soft green), `muted`, `info`; softer danger.
- **TabsList** `variant="pills"` — segmented control (Deployments / Queue style).
- **Dashboard** — welcome + CTA, KPIs, recent orders activity feed.
- Accent stays platform blue (`DESIGN.md`); green only for operational status.

## 2026-07-22 (Stalwart-inspired harvest — dark platform)

- **EmptyState:** optional `icon` (rounded square), `variant` `panel` | `plain`.
- **Alert:** `tone="warning"` + `title` + `onDismiss` (enterprise / upsell banner).
- **SearchField:** leading Lucide Search, optional `pill`.
- **ListPanel:** title + toolbar + body + footer chrome for list pages.
- **ActionTile** / **ActionTileGrid:** maintenance / tools action cards.
- **PaginationPrevNext:** compact Prev | Next cluster; Prev/Next buttons use chevrons.
- **PageHeader:** actions align top (toolbar-friendly).
- Storybook: EmptyState With icon, Alert Warning, SearchField, ListPanel, ActionTile.

## 2026-07-22 (Platform admin UX polish)

- **EmptyState:** optional `title` / `description` / `action` (CTA); `children` fallback; Storybook With CTA; actionable empties on Orders, Products, Pages, Categories, Media, Members.
- **TableFrame:** inner `overflow-x-auto` for mobile-safe wide tables.
- **Bulk:** Orders + Products client CSV export of selection; cancel bulk remains stubbed.
- **Toasts:** mark-paid / cancel, product create/update, members invite.
- **KpiBullet** + StatStrip `bullet` prop; Dashboard pending-payment + low-stock KPIs; Storybook WithBullets.
- **A11y / motion:** BulkActionBar `aria-live`; focus rings on table checkboxes + Cmd+K items; Lucide Search/Languages in Shell; `RouteFade` (~200ms, reduced-motion off).

## 2026-07-20 (Storefront header scroll dock)

- At page top: flat flush `StoreHeader` (no glass chrome).
- On scroll: Soft glass floating pill (`is-scrolled`) — inset, blur, shadow; desktop `border-radius: 9999px`.
- Island: `store-chrome.js` toggles class (rAF + 16px threshold); Storybook via `scrolled` prop.

## 2026-07-20 (Admin loading layer)

- **Spinner** atom (`sm`/`md`/`lg`) + Skeleton `variant="shimmer"`; CSS shimmer respects `prefers-reduced-motion`.
- Patterns: `TableSkeleton`, `FormSkeleton`, `PageSkeleton`, `LoadingBlock`, `LoadingOverlay` (`patterns/loading.tsx`).
- DataTable `loading` → `TableSkeleton`; admin list/detail pages use presets (no ad-hoc `Skeleton`×3 stacks).
- Storybook: `Components/Spinner`, enriched `Components/Skeleton`, `Patterns/Loading` (+ storefront theme proof).

## 2026-07-20 (Admin console Waves A–D executed)

- **Wave A:** `PageContent`, `TableFrame`, `SplitLayout`, PageHeader `breadcrumb`; all authenticated admin pages on layout recipe; Storybook `Patterns/ConsoleLayout`.
- **Wave B:** `FilterChips`, `DensityToggle`, `BulkActionBar`, DataTable selectable; Orders URL sync + chips + density + bulk stub + saved views (localStorage).
- **Wave C:** Reports CSS bar charts + StatStrip; Dashboard mobile KPI strip; `apps/admin/src/lib/saved-views.ts`.
- **Wave D:** Shell Cmd+K command palette; auth SignIn/SignUp hierarchy polish.
- **Wave E:** Deferred (platform glass) — keep opaque until Mestryx amends DESIGN.md.
- **Wave F:** F-01 ready for human sign-off — see checklist + PROGRESS.

## 2026-07-20 (Admin console master plan)

- Roadmap SSOT: [admin-console-master-plan.md](./admin-console-master-plan.md) — Waves A–F (density → table UX → charts/mobile → shell/auth → optional glass → F-01).
- Nothing dropped: former “out of scope” items ordered with gates (glass = conditional after DESIGN.md amend).

## 2026-07-20 (Storybook interaction play functions)

- Atoms with `play` + `storybook/test` (`expect` / `fn` / `userEvent`): Button (click + disabled spy), Checkbox toggle, Input type, Switch toggle.
- Debuggable in the Interactions panel; covered by `@storybook/addon-vitest`.

## 2026-07-20 (UI package coverage ≥95%)

- Vitest dual project: Storybook browser + unit (`happy-dom` / Testing Library).
- Thresholds: statements/functions/lines **95%**, branches **90%** (actual ~100% / ~92% branches).
- Gap coverage: open Radix sheets/dialogs/menus, DataTable loading/empty, AuthShell/Sidebar, PromoBanners/PdpLayout, motion reduced paths, FormPanel widths.
- `pnpm test` in `@mestryx/ui` runs with `--coverage`.

## 2026-07-20 (Storybook a11y WCAG cleanup)

- Tokens: darker platform `--primary` / `--destructive`; storefront `--destructive` + `--muted-foreground` for AA contrast on buttons/badges/toasts.
- Badge success/danger use solid fills (not /15 tint) for readable contrast.
- Progress default `aria-label`; ScrollArea viewport `tabIndex={0}`; CommandDialog `DialogTitle` (sr-only).
- Store nav landmarks labeled; footer column titles are `<p>` (heading-order); Select stories labeled.
- Cart drawer solid `--card` surface for readable muted text. Vitest a11y: 74/74 green.

## 2026-07-20 (Storybook Autodocs for atoms)

- All `Components/*.stories.tsx` use `tags: ["autodocs"]` + `parameters.layout: "centered"` — Docs page with Show/Copy code (All-Aboard-style).
- ArgTypes polish: Badge (`tone`), Button (`variant`/`size`), Alert (`tone`), Input, Card (`variant`), Checkbox.
- Patterns / Foundations / Storefront Vitrine: **no** autodocs (fullscreen compose stays story-only).

## 2026-07-20 (Storefront mobile burger nav)

- `StoreHeader`: mobile grid (brand + Cart + burger); Shop/Wishlist/theme/account in collapsible panel.
- Progressive enhancement: checkbox + label (works without JS); Escape closes via `store-chrome.js`.
- Desktop ≥768px: horizontal nav; burger hidden. Cart stays always visible (ecom high-intent).

## 2026-07-20 (Storefront Soft glass intensity + ambient)

- Glass chrome intensity +1 (`--glass-bg` more translucent, blur 18–20px, stronger border/shadow).
- Richer static `--background-ambient` radials (light + dark) so frosted surfaces read; no animated background (jewelry / CRO best practice).
- Still chrome-only — no glass on CTAs, hero media, or product photos.

## 2026-07-20 (Storefront Soft glass + drawer motion)

- Tokens `--glass-bg` / `--glass-border` / `--glass-blur` / `--glass-shadow` on `storefront` + `storefront-dark` only (admin untouched).
- Chrome surfaces: sticky header, PLP toolbar, cart drawer + overlay use Soft glass; product media stays opaque.
- Cart drawer open/close: CSS `is-open` slide/fade via `store-chrome.js` island; respects `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Storybook **Storefront/Vitrine → 05 Soft glass chrome**. Cart CTA color still deferred.

## 2026-07-20 (Storefront vitrine homepage)

- Homepage is a **store window**: full-bleed `StoreHero` vitrine, `CollectionCard` tiles, curated Featured rail — **no** price filters on clean `/`.
- Catalog mode (`?category=` / search / price) keeps PLP toolbar + CategoryNav.
- Research alignment: jewelry ecom 2026 — whitespace, curated home, filters on collection pages only.

## 2026-07-20 (Storefront Soft boutique + commerce patterns)

- Storefront `--radius: 8px` (tokens + presets); DESIGN.md Soft boutique lock (anti boxy cards).
- Patterns: `PriceDisplay`, `TrustStrip`, `ProductGallery`, `CartLine`, `CartDrawer`, `CheckoutLayout`, `OrderSummary`; ProductCard compare-at/sale; footer columns.
- `apps/web`: client island `store-chrome.js` (cart drawer + gallery thumbs), editable cart, checkout 2-col, cart badge/`cartCount`, price filters in €.
- Storybook **Storefront/Commerce** (PLP filters, PDP gallery, checkout). F-01 human brand sign-off still open.

## 2026-07-19 (Admin form layout pattern)

- `FormPanel` / `FormField` / `FormRow` / `FormActions` in `@mestryx/ui` (`patterns/form-layout.tsx`) — width constraints live in the pattern, not page-level `max-w-*` hacks.
- Storybook **Patterns/FormLayout** (platform); admin create/settings forms composed across Sites, Dashboard, Products, CMS, commerce, org, and auth pages.
- `pnpm ds:detect` clean; Input/Select remain `w-full` of parent.

## 2026-07-19 (Platform skeleton UX pass)

- `NavSection` for grouped sidebar IA; AppShell density (15rem, tighter padding).
- `Card` variants `panel` | `ghost` (anti card-in-card).
- Admin Shell: Overview / Workspace / Content / Commerce / Organization sections + i18n.
- P0 pages composed: Dashboard, Sites, Products, Orders, Sign-in (table-first lists).

## 2026-07-19 (Wave UX — Storybook dual-theme audit)

- Ambient tokens `--background-ambient` for platform + storefront; AppShell / AuthShell / StoreHero / web `body` consume them.
- Gap harvest into `@mestryx/ui`: Breadcrumb, Pagination, Popover, Switch, Command, Toast, RadioGroup, Progress, Accordion, ScrollArea, DataTable.
- Patterns: PageHeader, FilterBar, StatStrip, Dropzone + StoreHero story; admin pages composed with PageHeader; shell Toaster.
- Checklist § Storybook loop log + V/C/P/M mostly `done` (F-01 human sign-off open). `pnpm ds:detect` clean.

## 2026-07-19 (N-site theme presets)

- Presets in `@mestryx/tokens/presets` (`storefront-base`, `luna`, `storefront-dark`, `platform`).
- Storefront default CSS = Studio `:root` OKLCH; Luna seed `themeJson.preset=luna`.
- themeJson **v2** + full CSS var emitter; admin preset picker.
- Doc: [site-theming.md](./site-theming.md).

## 2026-07-19 (Shadcn CSS variable names)

- Migrated runtime tokens from `--mx-*` to native shadcn names (`--background`, `--primary`, …) under `data-theme=platform|storefront`.
- Expanded schema: sidebar, chart-1..5, radius scale in `@theme`; Mestryx extensions `--font-display`, `--flash-bg`, `--flash-border`.
- Doc: [shadcn-css-variables.md](./shadcn-css-variables.md). Values remain HEX (OKLCH later).

## 2026-07-19 (Design pro agent stack)

- Coupled Impeccable with Taste v2, UI UX Pro Max, Huashu Design, and Playwright smoke.
- Meta-skill `saas-frontend-impeccable` updated (routing, one-shot playbook, jargon); Huashu philosophies EN reference.
- `pnpm --filter @mestryx/ui storybook:smoke` — dual-theme Playwright checks (gated by `RUN_STORYBOOK_E2E=1`).

## 2026-07-19 (Storybook catalog)

- Added Foundations/Catalog (scrollable atom listing + Patterns index), alongside per-component stories — same idea as All-Aboard Documentation/Catalog, Mestryx-owned.

## 2026-07-19 (Storybook dual-theme lock)

- Pattern stories pin `globals.theme` (AppShell → platform; StoreHeader/ProductCard → storefront) via `.storybook/theme.ts`.
- Added Foundations/Themes SideBySide (Button, Input, Card + display font in both themes).

## 2026-07-19 (Storybook canvas)

- Fixed blank/white Storybook preview: long-running Vite HMR could drop the Tailwind utilities layer while tokens remained (white text on transparent iframe).
- Hardened `.storybook/preview.css` + inline theme styles (canvas baseline independent of utilities); `@source` includes `.storybook/`.
- Ops note: if the canvas goes blank again after a long HMR session, restart `pnpm --filter @mestryx/ui storybook`.

## 2026-07-19

- **Visual correction:** self-hosted IBM Plex + Fraunces (`@mestryx/tokens/fonts`) in Storybook + admin.
- Replaced thin `.ui-*` atom wrappers with CVA/Radix shadcn-style primitives; Dialog/Sheet/Tabs/Tooltip/Dropdown/Avatar/Skeleton/Separator added.
- Storybook: 28 story files (Foundations/Colors|Typography|Spacing + one file per component + polished patterns).
- AppShell + storefront chrome restyled with Tailwind + dual-theme CSS vars.
- Phase 0–6 earlier FB-037 tooling retained (Impeccable, PRODUCT/DESIGN, detect CI).

## 2026-07-19 (earlier)

- Phase 0: Impeccable installed (Cursor + GitHub skills/hooks); Claude skill mirrored under `.claude/skills/impeccable`.
- Phase 0: Orchestration skill `mestryx-design-system`; light adapt `design-md`, `design-system-patterns`, `qa-checklist`, `frontend-react` rule.
- Phase 0: Baseline `impeccable detect packages/ui/src` → empty findings ([reports/detect-baseline-2026-07-19.json](./reports/detect-baseline-2026-07-19.json)).
- Phase 0: `.gitignore` impeccable ephemeral block added.
- Phase 1: `PRODUCT.md` + `DESIGN.md` (lint 0 errors); brand-brief visuals provisional accepted; tokens already aligned.
- Phase 2: Tailwind 4.3.2 + tw-animate-css + motion 12 + `components.json` + `lib/utils` + `patterns/motion`; admin Vite plugin; web CSS prefers `dist/styles.css`.
- Phase 3–4: Taxonomy move to `components/` + `patterns/`; per-area Storybook stories; removed `gallery.stories.tsx`.
- Phase 5: `pnpm ds:detect`, CI job `design-system`, font ignores + legacy type/radius rule ignores in `.impeccable/config.json`.
- Phase 6: Admin/web already on `@mestryx/ui`; typecheck green; FB-037 marked done.
