# UX / UI harmony checklist — mestryx-platform

**Status:** Mostly done — F-01 human brand sign-off still open (before staging FB-044)  
**Created:** 2026-07-19  
**SSOT for this wave:** this file. Update rows as work lands; keep [component-directory.md](./component-directory.md) in sync for shipped atoms.

**Related:** [PRODUCT.md](../../PRODUCT.md) · [DESIGN.md](../../DESIGN.md) · [brand-brief.md](../brand-brief.md) · skill `mestryx-design-system` · Impeccable / `saas-frontend-impeccable`

---

## Decision (how we work)

| Approach | Verdict |
|----------|---------|
| Drop in a full Shadcn Studio **template** (Shopix / Flow / AdminCN) as the app | **No** — fights dual-theme tokens, Hono SSR web, existing routes, and PRODUCT anti-references |
| Page-by-page polish only, invent every pattern | **Slow** — reinvent wheels Studio already solved |
| **Hybrid (chosen)** | Keep `@mestryx/tokens` + `@mestryx/ui` as ownership. Use Studio **blocks** (+ free AdminCN / Shopix patterns) as **reference + harvest** into `packages/ui`. Then audit **every page** with skills for harmony |

**Rules**

1. New atoms/patterns → `packages/ui` only (no second shadcn tree in apps).
2. `PRODUCT.md` / `DESIGN.md` / tokens win over template aesthetics (no purple SaaS, no Inter **on storefront**, no card soup). Platform admin uses Inter (Dokploy-aligned) — see ADR-0002.
3. Studio code = inspiration / starting point → re-theme to **shadcn CSS vars** ([shadcn-css-variables.md](./shadcn-css-variables.md)), dual `platform` \| `storefront`.
4. Pro templates: use as **mood / IA reference** unless Mestryx owns a license; prefer **free** blocks + official shadcn CLI for code.

**Skills per pass**

| Pass | Skill / tool |
|------|----------------|
| Orchestration | `mestryx-design-system` |
| Anti-slop / polish | Impeccable (`audit` / `polish` / `detect`) |
| SaaS UX patterns | `saas-frontend-impeccable` |
| Tokens / DESIGN.md | `design-md` |
| A11y | `accessibility` |
| Motion | [motion-guidelines.md](./motion-guidelines.md) |

**Row legend**

| Column | Meaning |
|--------|---------|
| **V** | Verify (looks / contrast / IA / responsive) |
| **C** | Correct (fix visual bugs, spacing, hierarchy) |
| **P** | Complete / polish (raise to brand bar) |
| **M** | Manage (Storybook, directory, detect, i18n) |
| Status | `todo` · `doing` · `done` · `n/a` · `blocked` |

---

## 0. Foundations (do first)

| ID | Item | Path / note | V | C | P | M | Status | Notes |
|----|------|-------------|---|---|---|---|--------|-------|
| F-01 | Brand brief visuals validated by Mestryx | `docs/brand-brief.md` | ☐ | ☐ | ☐ | ☐ | todo | PROGRESS gate still open |
| F-02 | DESIGN.md ↔ tokens + N-site presets | `DESIGN.md`, tokens, [site-theming.md](./site-theming.md) | ☑ | ☑ | ☑ | ☑ | done | OKLCH storefront-base + Luna preset |
| F-03 | Platform theme ambient (not flat black) | tokens + admin shell | ☑ | ☑ | ☑ | ☑ | done | Anti flat single-color |
| F-04 | Storefront theme ambient (not cream-cliché) | tokens + web chrome | ☑ | ☑ | ☑ | ☑ | done | Distinct from Piblox |
| F-05 | Typography scale + display usage | Foundations stories | ☑ | ☑ | ☑ | ☑ | done | Fraunces storefront only |
| F-06 | Spacing / radius consistency | Foundations | ☑ | ☑ | ☑ | ☑ | done | Platform 8px / storefront 0 |
| F-07 | Focus rings + keyboard nav | all interactive | ☑ | ☑ | ☑ | ☑ | done | |
| F-08 | `prefers-reduced-motion` | motion helpers | ☑ | ☑ | ☑ | ☑ | done | |
| F-09 | `pnpm ds:detect` clean | UI + apps | ☑ | ☑ | ☑ | ☑ | done | |
| F-10 | Storybook blank-canvas known fix | stack-and-tooling | ☑ | ☑ | ☑ | ☑ | done | Ops note |
| F-11 | Web fonts: self-host vs Google link | `apps/web` seo | ☑ | ☑ | ☑ | ☑ | done | Faces match tokens; Google CDN for SSR (admin/SB self-host) |
| F-12 | Command palette (brand brief SaaS UX) | admin | ☑ | ☑ | ☑ | ☑ | done | Command + CommandDialog in `@mestryx/ui` |

---

## 1. `@mestryx/ui` atoms — inventory vs gaps

### 1.1 Present (verify harmony, not rebuild)

| ID | Component | V | C | P | M | Status | Notes |
|----|-----------|---|---|---|---|--------|-------|
| A-01 | Button | ☑ | ☑ | ☑ | ☑ | done | |
| A-02 | Input / Textarea / Label | ☑ | ☑ | ☑ | ☑ | done | |
| A-03 | Select (native) | ☑ | ☑ | ☑ | ☑ | done | Consider Radix Select later |
| A-04 | Checkbox | ☑ | ☑ | ☑ | ☑ | done | |
| A-05 | Card / Stack / Alert / Badge | ☑ | ☑ | ☑ | ☑ | done | Avoid card-for-everything |
| A-06 | Table | ☑ | ☑ | ☑ | ☑ | done | |
| A-07 | EmptyState / Text / Muted | ☑ | ☑ | ☑ | ☑ | done | |
| A-08 | Separator / Skeleton / Avatar | ☑ | ☑ | ☑ | ☑ | done | |
| A-09 | Dialog / Sheet | ☑ | ☑ | ☑ | ☑ | done | |
| A-10 | Tabs / Tooltip / DropdownMenu | ☑ | ☑ | ☑ | ☑ | done | |
| A-11 | MotionPresence / MotionPress | ☑ | ☑ | ☑ | ☑ | done | |

### 1.2 Missing atoms (complete via shadcn CLI → `packages/ui`)

| ID | Component | Priority | Studio / shadcn hint | V | C | P | M | Status |
|----|-----------|----------|----------------------|---|---|---|---|--------|
| G-01 | Breadcrumb | P1 | admin deep pages | ☑ | ☑ | ☑ | ☑ | done |
| G-02 | Pagination | P1 | tables / PLP | ☑ | ☑ | ☑ | ☑ | done |
| G-03 | Popover | P1 | filters, menus | ☑ | ☑ | ☑ | ☑ | done |
| G-04 | Command (cmdk) | P1 | brand brief palette | ☑ | ☑ | ☑ | ☑ | done |
| G-05 | Switch | P2 | settings / modules | ☑ | ☑ | ☑ | ☑ | done |
| G-06 | RadioGroup | P2 | checkout / forms | ☑ | ☑ | ☑ | ☑ | done |
| G-07 | Progress | P2 | uploads / checkout | ☑ | ☑ | ☑ | ☑ | done |
| G-08 | Accordion | P2 | FAQ / order detail | ☑ | ☑ | ☑ | ☑ | done |
| G-09 | ScrollArea | P2 | sidebars / media | ☑ | ☑ | ☑ | ☑ | done |
| G-10 | Toast / Sonner | P1 | admin mutations | ☑ | ☑ | ☑ | ☑ | done |
| G-11 | Form (RHF/zod helpers) | P2 | admin CRUD | ☐ | ☐ | ☐ | ☐ | n/a | Deferred — use existing Label/Input stacks |
| G-12 | DataTable pattern | P1 | Studio datatable block | ☑ | ☑ | ☑ | ☑ | done |
| G-13 | Calendar / DatePicker | P3 | reports / shipping | ☐ | ☐ | ☐ | ☐ | n/a | Deferred P3 |
| G-14 | Slider | P3 | price filters | ☐ | ☐ | ☐ | ☐ | n/a | Deferred P3 |
| G-15 | NavigationMenu | P2 | storefront mega-nav | ☐ | ☐ | ☐ | ☐ | n/a | Deferred — CategoryNav covers MVP |

---

## 2. Patterns (platform × storefront)

| ID | Pattern | Path | V | C | P | M | Status | Notes |
|----|---------|------|---|---|---|---|--------|-------|
| P-01 | AppShell | `patterns/app-shell.tsx` | ☑ | ☑ | ☑ | ☑ | done | Dokploy-flat groups; Commerce collapsible |
| P-02 | AuthShell | same | ☑ | ☑ | ☑ | ☑ | done | Sign-in / up harmony |
| P-03 | NavLink / active states | AppShell | ☑ | ☑ | ☑ | ☑ | done | Grouped sections; commerce gated |
| P-04 | StoreHeader | `patterns/storefront.tsx` | ☑ | ☑ | ☑ | ☑ | done | Search, cart, account |
| P-05 | StoreHero | storefront | ☑ | ☑ | ☑ | ☑ | done | Brand-first, full-bleed |
| P-06 | ProductCard | storefront | ☑ | ☑ | ☑ | ☑ | done | Image ratio, price, wishlist |
| P-07 | PageHeader (admin) | missing → add | ☑ | ☑ | ☑ | ☑ | done | Title + actions + crumbs |
| P-08 | FilterBar / Toolbar | missing → add | ☑ | ☑ | ☑ | ☑ | done | Lists + PLP |
| P-09 | StatStrip / KPI cards | missing → add | ☑ | ☑ | ☑ | ☑ | done | Dashboard only; not hero |
| P-10 | MediaThumb / Dropzone | missing → add | ☑ | ☑ | ☑ | ☑ | done | Media library |

---

## 3. Shadcn Studio — reference map

Catalog snapshot: [shadcnstudio.com/templates](https://shadcnstudio.com/templates) · [blocks](https://shadcnstudio.com/blocks) (2026-07-19).

### 3.1 Templates — relevance

| Template | Tier | Relevance | Use as | Action |
|----------|------|-----------|--------|--------|
| **AdminCN Free** | Free | **High** — admin shell, tables, settings | Reference + harvest layouts | Primary admin mood |
| **AdminCN Pro** | Pro | High | Reference only unless licensed | Compare IA |
| **CommerceO** | Pro | **High** — commerce admin | Reference for Orders/Products | Mood boards |
| **Shopix** | Pro | **High** — full shop | Storefront IA / PDP / cart / checkout | Pattern harvest |
| **Flow** (SaaS LP) | Pro | Med — marketing only | Optional later marketing site | Out of product UI |
| Matter / Grow / Craft / … | Pro/Free | Low–Med | Marketing / niche | Skip for core product |
| PropXYZ / Promptly / Calendrix / AIDesk / Sprintrix | Pro | Low | Wrong domain | Skip |
| SkillSphere / Brandly / Ink / Track / Bistro | — | Low | Niche | Skip |
| Neural / Orion / Swipe | Pro | Low | AI/mobile marketing | Skip |

### 3.2 Blocks — harvest candidates (by surface)

Mark **M** when absorbed into `packages/ui` or documented as `n/a`.

#### Dashboard & application → **Admin**

| ID | Block | URL slug | Priority | V | C | P | M | Status |
|----|-------|----------|----------|---|---|---|---|--------|
| B-A01 | application-shell | `dashboard-and-application/application-shell` | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-A02 | dashboard-shell | `…/dashboard-shell` | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-A03 | dashboard-sidebar | `…/dashboard-sidebar` | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-A04 | dashboard-header | `…/dashboard-header` | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-A05 | statistics-component | `…/statistics-component` | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-A06 | widgets-component | `…/widgets-component` | P2 | ☑ | ☑ | ☑ | ☑ | done |
| B-A07 | charts-component | `…/charts-component` | P2 | ☑ | ☑ | ☑ | ☑ | done |
| B-A08 | form-layout | `…/form-layout` | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-A09 | multi-step-form | `…/multi-step-form` | P2 | ☑ | ☑ | ☑ | ☑ | done |
| B-A10 | file-upload | `…/file-upload` | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-A11 | empty-state | `…/empty-state` | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-A12 | account-settings | `…/account-settings` | P2 | ☑ | ☑ | ☑ | ☑ | done |
| B-A13 | onboarding-feed | `…/onboarding-feed` | P3 | ☑ | ☑ | ☑ | ☑ | done |
| B-A14 | datatable-component | `datatable/datatable-component` | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-A15 | card-nav | `…/card-nav` | P3 | ☐ | ☐ | ☐ | ☐ | n/a | Prefer list nav |
| B-A16 | dashboard-dialog / dropdown / footer | misc | P2 | ☑ | ☑ | ☑ | ☑ | done |

#### Ecommerce → **Storefront (+ admin commerce cues)**

| ID | Block | Priority | V | C | P | M | Status |
|----|-------|----------|---|---|---|---|--------|
| B-E01 | product-list | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-E02 | product-overview | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-E03 | product-quick-view | P2 | ☑ | ☑ | ☑ | ☑ | done |
| B-E04 | product-category | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-E05 | category-filter | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-E06 | shopping-cart | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-E07 | checkout-page | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-E08 | order-summary | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-E09 | announcement-banner | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-E10 | mega-footer | P2 | ☑ | ☑ | ☑ | ☑ | done |
| B-E11 | offer-modal | P3 | ☑ | ☑ | ☑ | ☑ | done |
| B-E12 | product-reviews | P3 | ☐ | ☐ | ☐ | ☐ | blocked | FB-101 icebox |
| B-E13 | gift-card | P3 | ☐ | ☐ | ☐ | ☐ | n/a | |

#### Marketing UI → **Auth / trust / CMS chrome** (selective)

| ID | Block | Priority | V | C | P | M | Status |
|----|-------|----------|---|---|---|---|--------|
| B-M01 | login-page / register | P0 | ☑ | ☑ | ☑ | ☑ | done |
| B-M02 | forgot / reset / verify-email | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-M03 | cookies-consent | P1 | ☑ | ☑ | ☑ | ☑ | done | Align FB-076 |
| B-M04 | navbar-component | P1 | ☑ | ☑ | ☑ | ☑ | done |
| B-M05 | hero-section | P1 | ☑ | ☑ | ☑ | ☑ | done | Storefront / CMS home |
| B-M06 | footer-component | P2 | ☑ | ☑ | ☑ | ☑ | done |
| B-M07 | faq / features / testimonials | P3 | ☐ | ☐ | ☐ | ☐ | n/a | CMS blocks later |
| B-M08 | error-page | P2 | ☑ | ☑ | ☑ | ☑ | done | 404/500 |
| B-M09 | pricing-component | P3 | ☑ | ☑ | ☑ | ☑ | done | Billing marketing only |
| B-M10 | AI / video / waitlist / … | — | ☐ | ☐ | ☐ | ☐ | n/a | Skip |

---

## 4. Admin pages (page-by-page)

File root: `apps/admin/src/pages/`.

| ID | Page | Route (approx) | V | C | P | M | Status | Focus |
|----|------|----------------|---|---|---|---|--------|-------|
| AD-01 | DashboardPage | `/` | ☑ | ☑ | ☑ | ☑ | done | skeleton pass: table + panel form |
| AD-02 | SignInPage | `/sign-in` | ☑ | ☑ | ☑ | ☑ | done | skeleton pass: single panel Card |
| AD-03 | SignUpPage | `/sign-up` | ☑ | ☑ | ☑ | ☑ | done | |
| AD-04 | AcceptInvitePage | `/accept-invite` | ☑ | ☑ | ☑ | ☑ | done | |
| AD-05 | SitesPage | `/sites` | ☑ | ☑ | ☑ | ☑ | done | skeleton pass: list + panel settings |
| AD-06 | MembersPage | `/members` | ☑ | ☑ | ☑ | ☑ | done | Roles UX |
| AD-07 | PagesPage | `/pages` | ☑ | ☑ | ☑ | ☑ | done | Preview CTA polish |
| AD-08 | MediaLibraryPage | `/media` | ☑ | ☑ | ☑ | ☑ | done | Grid + upload |
| AD-09 | MenusPage | `/menus` | ☑ | ☑ | ☑ | ☑ | done | Tree / drag later |
| AD-10 | ProductsPage | `/products` | ☑ | ☑ | ☑ | ☑ | done | skeleton pass: FilterBar + table |
| AD-11 | CategoriesPage | `/categories` | ☑ | ☑ | ☑ | ☑ | done | |
| AD-12 | OrdersPage | `/orders` | ☑ | ☑ | ☑ | ☑ | done | skeleton pass: FilterBar + Badge |
| AD-13 | OrderDetailPage | `/orders/:id` | ☑ | ☑ | ☑ | ☑ | done | Timeline |
| AD-14 | ReturnsPage | `/returns` | ☑ | ☑ | ☑ | ☑ | done | + abandoned carts card |
| AD-15 | ShippingPage | `/shipping` | ☑ | ☑ | ☑ | ☑ | done | |
| AD-16 | CouponsPage | `/coupons` | ☑ | ☑ | ☑ | ☑ | done | |
| AD-17 | BannersPage | `/banners` | ☑ | ☑ | ☑ | ☑ | done | |
| AD-18 | ModulesPage | `/modules` | ☑ | ☑ | ☑ | ☑ | done | Entitlements |
| AD-19 | BillingPage | `/billing` | ☑ | ☑ | ☑ | ☑ | done | Stub clarity |
| AD-20 | ReportsPage | `/reports` | ☑ | ☑ | ☑ | ☑ | done | Charts later |
| AD-21 | Shell chrome | `components/Shell.tsx` | ☑ | ☑ | ☑ | ☑ | done | Real nav IA sections + org footer |
| AD-22 | Global empty / error / loading | shared | ☑ | ☑ | ☑ | ☑ | done | |

---

## 5. Storefront pages (page-by-page)

Views: `apps/web/src/views.tsx` · routing: `apps/web/src/server.ts`.

| ID | Page | Path | V | C | P | M | Status | Focus |
|----|------|------|---|---|---|---|--------|-------|
| SF-01 | HomePage | `/` | ☑ | ☑ | ☑ | ☑ | done | Hero + merch, brand-first |
| SF-02 | PLP / product list | `/products` (+ filters) | ☑ | ☑ | ☑ | ☑ | done | Filters, grid, empty |
| SF-03 | ProductPage (PDP) | `/products/:slug` | ☑ | ☑ | ☑ | ☑ | done | Gallery, CTA, trust |
| SF-04 | CartPage | `/cart` | ☑ | ☑ | ☑ | ☑ | done | Line items, totals |
| SF-05 | CheckoutPage | `/checkout` | ☑ | ☑ | ☑ | ☑ | done | Steps, address book |
| SF-06 | OrderPage | order confirmation | ☑ | ☑ | ☑ | ☑ | done | |
| SF-07 | OrderTrackPage | tracking | ☑ | ☑ | ☑ | ☑ | done | |
| SF-08 | WishlistPage | `/wishlist` | ☑ | ☑ | ☑ | ☑ | done | |
| SF-09 | CmsPageView | `/:slug` | ☑ | ☑ | ☑ | ☑ | done | Blocks + preview banner |
| SF-10 | AccountSignIn | `/account/sign-in` | ☑ | ☑ | ☑ | ☑ | done | |
| SF-11 | AccountSignUp | `/account/sign-up` | ☑ | ☑ | ☑ | ☑ | done | |
| SF-12 | AccountPage | `/account` | ☑ | ☑ | ☑ | ☑ | done | Orders list |
| SF-13 | AccountOrderPage | `/account/orders/:id` | ☑ | ☑ | ☑ | ☑ | done | Return request UI |
| SF-14 | Search results | search UX | ☑ | ☑ | ☑ | ☑ | done | FB-074 surface |
| SF-15 | Legal / consent chrome | banners, cookies | ☑ | ☑ | ☑ | ☑ | done | Trust |
| SF-16 | 404 / error | global | ☑ | ☑ | ☑ | ☑ | done | |

---

## 6. Cross-cutting quality

| ID | Concern | V | C | P | M | Status | Notes |
|----|---------|---|---|---|---|--------|-------|
| X-01 | Responsive breakpoints (sm/md/lg) | ☑ | ☑ | ☑ | ☑ | done | All pages |
| X-02 | Dark platform contrast WCAG | ☑ | ☑ | ☑ | ☑ | done | `design-md` lint |
| X-03 | Light storefront contrast | ☑ | ☑ | ☑ | ☑ | done | |
| X-04 | i18n EN/FR admin strings | ☑ | ☑ | ☑ | ☑ | done | No FR in EN locales |
| X-05 | Loading / skeleton parity | ☑ | ☑ | ☑ | ☑ | done | |
| X-06 | Empty states copy (PRODUCT voice) | ☑ | ☑ | ☑ | ☑ | done | No hype |
| X-07 | Destructive actions confirm | ☑ | ☑ | ☑ | ☑ | done | Dialog |
| X-08 | Image aspect / CLS | ☑ | ☑ | ☑ | ☑ | done | Media + PLP |
| X-09 | Icon system consistency | ☑ | ☑ | ☑ | ☑ | done | One set; no emoji UI |
| X-10 | Motion budget (2–3 intentional) | ☑ | ☑ | ☑ | ☑ | done | Per key surfaces |
| X-11 | Tenant theme overrides | ☑ | ☑ | ☑ | ☑ | done | FB-085 surface |
| X-12 | Remotion brand film (optional) | ☐ | ☐ | ☐ | ☐ | n/a | Marketing only |

---

## 7. Suggested execution waves

| Wave | Scope | Est. | Exit |
|------|-------|------|------|
| **UX-0** | F-01…F-12 foundations + missing atoms G-01…G-12 harvest | 2–3 cycles | Tokens locked; Storybook atoms; detect clean |
| **UX-1** | Admin shell + AD-01…AD-06 + Auth | 2–3 cycles | Admin looks intentional under platform theme |
| **UX-2** | Admin commerce lists AD-10…AD-17 (DataTable pattern) | 2–3 cycles | Tables/filters/empty states consistent |
| **UX-3** | Storefront SF-01…SF-08 (Shopix-inspired patterns) | 3–4 cycles | PLP/PDP/cart/checkout on brand |
| **UX-4** | Account + CMS + trust SF-09…SF-16 · cross-cut X-* | 2 cycles | Harmony pass; checklist mostly `done` |
| **Then** | Staging FB-044 / launch FB-045 · optional Stripe FB-070 | — | Visual bar met |

**Estimate (uncertain):** ~8–12 agent cycles + 2–4 human review days. Buffer for F-01 visual sign-off.

---

## 8. Definition of Done (this wave)

- [x] Foundations F-* mostly `done` (F-01 signed by Mestryx — **pending human**)
- [x] Critical gaps G-01…G-12 shipped or waived with note
- [x] All AD-* and SF-* rows at least **V** checked; P0 pages **P** done
- [x] `component-directory.md` + CHANGELOG updated
- [x] `pnpm ds:detect` green; Storybook smoke on shell + storefront patterns
- [ ] PROGRESS: brand visuals checkbox (F-01) + UX harmony wave milestone noted
- [x] No staging deploy required to close this wave

---



---

## 10. Storybook loop log

Mandatory dual-theme audit (plan Wave UX). Decision: `shared` | `platform-biased` | `storefront-biased` | `harvest` | `n/a`.

| ID | Decision | Refs | Skills run | Commit |
|----|----------|------|------------|--------|
| SB-F-01 | shared | shadcn CSS vars · site-theming | mestryx-design-system | (this wave) |
| SB-F-02 | shared / storefront display | Fraunces · IBM Plex | design-md | |
| SB-F-03 | shared | spacing scale | impeccable detect | |
| SB-F-04 | shared | SideBySide themes | — | |
| SB-F-05 | shared | Foundations/Catalog | — | |
| SB-C-01…21 | shared (table platform-biased) | official shadcn | accessibility | |
| SB-P-01 | platform-biased | AdminCN shell | saas-frontend-impeccable | |
| SB-P-02 | storefront-biased | Shopix header | — | |
| SB-P-03 | storefront-biased | product-card | — | |
| SB-P-04 | shared | motion-guidelines | motion | |
| SB-P-05 | storefront-biased | StoreHero full-bleed | frontend-design rules | |
| SB-P-new | harvest | PageHeader · FilterBar · StatStrip · Dropzone | — | |
| G-01…G-10,G-12 | harvest | shadcn CLI / cmdk / sonner | — | |
| G-11 | Form (RHF/zod helpers) | P2 | admin CRUD | ☐ | ☐ | ☐ | ☐ | n/a | Deferred — use existing Label/Input stacks |
| AD-01…AD-22 | platform-biased | PageHeader compose | saas-frontend-impeccable | |
| SF-01…SF-16 | storefront-biased | Soft boutique + Storefront/Commerce | — | 2026-07-20 |
| X-01…X-11 | shared | responsive · contrast · i18n | accessibility | |

## 9. Working log

| Date | Change |
|------|--------|
| 2026-07-19 | Initial checklist; hybrid Studio harvest + page audit chosen over full template swap |
| 2026-07-19 | Wave UX Storybook dual-theme audit: ambient tokens, gap atoms, patterns, admin PageHeader, storefront FilterBar/Hero |
| 2026-07-19 | Platform skeleton UX pass: NavSection, Card variants, Shell IA, P0 pages |
| 2026-07-20 | Storefront Soft boutique: radius 8px, ProductGallery/TrustStrip/CartDrawer/CheckoutLayout; web client island; editable cart; docs lock |
