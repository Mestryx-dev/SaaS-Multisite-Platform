# Feature backlog

Prioritised executable backlog derived from [06-feature-catalog-and-priority.md](./06-feature-catalog-and-priority.md).  
Statuses: `todo` · `doing` · `blocked` · `done` · `deferred`.

**Last synced**: 2026-08-04 — Marketing landing + legal (FB-105). Must stay aligned with [PROGRESS.md](../PROGRESS.md) and code (see [10-agent-ops.md](./10-agent-ops.md) §2.2). Journey map: [13-journey-audit.md](./13-journey-audit.md).

## Sequencing

**Goal:** complete product before public launch. Staging, legal packaging, and go-live are **late gates**, not the north star.

| Order | Track | Focus |
|------:|-------|--------|
| 1 | Design system | `packages/ui` depth + Storybook (FB-036/037 largely done) |
| 2 | Merch discovery | FB-073 banners, FB-074 search |
| 3 | Trust / legal | FB-076 consent, FB-077 legal, FB-098 CSP |
| 4 | CMS depth | FB-075 blocks, FB-088 nav, FB-086 media, FB-087 preview (later) |
| 5 | Shop UX | FB-078 address book, FB-080 tracking, FB-083 PLP filters, FB-079 wishlist |
| 6 | Platform brand / ops | FB-084 modules, FB-085 theme, FB-089 Umami, FB-097 entitlements UX |
| 7 | Store polish + payment prep | FB-102 Soft boutique polish, FB-103 payment seams, FB-104 tracking/RMA polish |
| 8 | Deferred commerce | Stripe Capture = FB-070 when unlocked (prep = FB-103) |
| 9 | Go-to-market | FB-105 marketing landing + legal (Astro, FR+EN) |
| 10 | Release gates | Staging → launch checklist (FB-044/045) |

Stripe end-customer capture (**FB-070**) stays deferred until explicitly unlocked. FB-081/082 are done; only FB-070 remains deferred for money movement.

## Definition of Ready

- Acceptance criteria written  
- `Requires` features Done or waived by ADR  
- Open question affecting scope answered (or assumption accepted)  

## Definition of Done

- Tests (unit/request) for happy path + tenant isolation where relevant  
- Docs sync loop complete ([10 §2.2](./10-agent-ops.md#22-docs-sync-loop-systematic--mestryx-policy)): this file first; `PROGRESS.md` only if phase-level milestone; OpenAPI / data-dictionary if schema/contract changed — **not** status patches in 06/12/13  
- No secrets committed  
- CI green  
- Commit + push when green  

## Phase 0 — spec

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-000 | Answer open questions Q1–Q16 | task | P0 | done | 1d | — |
| FB-001 | Validate app-spec + ADR-0001 | task | P0 | done | 0.5d | FB-000 |
| FB-002 | Freeze MVP cut (Option B commerce) | decision | P0 | done | 0.5d | FB-000 |

## Phase 1 — skeleton

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-010 | Scaffold pnpm/turbo monorepo | task | P0 | done | 2d | FB-001 |
| FB-011 | API health + Postgres + Drizzle | feature | P0 | done | 3d | FB-010 |
| FB-012 | CI (typecheck, Vitest, build) | task | P0 | done | 1d | FB-010 |
| FB-013 | Sentry + structured logs stub | task | P0 | done | 1d | FB-011 |
| FB-014 | Secrets / env templates | task | P0 | done | 0.5d | FB-010 |

## Phase 2 — identity & tenancy

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-020 | Better Auth email/password + verify + reset | feature | P0 | done | 4d | FB-011 |
| FB-021 | Organization + memberships + roles | feature | P0 | done | 4d | FB-020 |
| FB-022 | Cross-tenant isolation test suite | feature | P0 | done | 2d | FB-021 |
| FB-023 | Auth rate limiting | feature | P0 | done | 1d | FB-020 |

## Phase 3 — admin + sites + design system

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-030 | Admin shell (nav SaaS patterns) | feature | P0 | done | 4d | FB-020 |
| FB-031 | Workspace switcher | feature | P0 | done | 2d | FB-021, FB-030 |
| FB-032 | Site CRUD + settings | feature | P0 | done | 3d | FB-022, FB-030 |
| FB-033 | packages/ui baseline | feature | P1 | done | 3d | FB-010 |
| FB-034 | Admin CMS pages UI | feature | P0 | done | 3d | FB-032 |
| FB-035 | Invite members UI | feature | P1 | done | 2d | FB-021, FB-030 |
| FB-036 | Storybook for packages/ui | feature | P1 | done | 2d | FB-033 |
| FB-037 | DS depth: Tailwind 4.3 + shadcn 4 + motion 12 + stories | feature | P1 | done | 3–5d | FB-036 |
| FB-038 | Full i18n (admin gap + store SSR + email + parity CI) | feature | P1 | done | 3–5d | FB-030, FB-041 |

**DS note (FB-037):** Hub + PRODUCT/DESIGN + Impeccable + Tailwind/motion. **Visual correction:** self-hosted fonts, CVA/Radix atoms, 28 Storybook stories, polished shells. Native `Select` API kept for admin/web.

**i18n (FB-038):** SSOT [design-system/i18n.md](./design-system/i18n.md). Admin `i18next` (~298 keys); store `t(locale)` + chrome inject (129 keys); email `emailT` (33 keys); `packages/ui` props-only. CI: `pnpm check:i18n`. Locale: admin `admin-lng`; store/email `site.defaultLocale`.

**Admin UX polish (2026-07-23):** Hard session gate + branded `AuthShell`; org switcher SSOT in shell topBar (`useSelectedOrgId`); Sites/Pages/Products create|manage behind Dialog/Sheet (list-first). Boot splash + `?bootPreview` unchanged (no forced delay).

**Invites note (FB-035 / F-107 / F-205):** Custom `organization_invite` table (not Better Auth organization plugin). Invite roles `admin|editor|viewer` only. Accept URL uses `ADMIN_ORIGIN` (default `http://localhost:5174`).

## Phase 4 — public runtime + domains

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-040 | Host resolution + subdomain | feature | P0 | done | 3d | FB-032 |
| FB-041 | Public layout + legal stubs | feature | P0 | done | 2d | FB-040 |
| FB-042 | Custom domain verify + TLS path | feature | P0 | done | 5d | FB-040 |
| FB-043 | SSR SEO/AI surfaces (sitemap, robots, llms.txt, JSON-LD) | feature | P0 | done | 2d | FB-041 |
| FB-044 | Staging Dokploy + DNS + secrets | task | P2 | deferred | 2d | FB-042 |
| FB-045 | Launch checklist (isolation, webhooks, backups, legal) | task | P2 | deferred | 2d | FB-044 |

## Phase 5 — platform billing (Mestryx → tenant)

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-050 | Plans + Stripe Customer | feature | P0 | done | 3d | FB-021 |
| FB-051 | Checkout + Customer Portal | feature | P1 | done | 3d | FB-050 |
| FB-052 | Subscription + payment_failed webhooks | feature | P0 | done | 3d | FB-050 |
| FB-053 | Entitlements (site limits) | feature | P0 | done | 2d | FB-052, FB-032 |

*Note:* FB-050/052/053 shipped earlier; **FB-051** adds real Stripe Checkout + Customer Portal when `STRIPE_*` test keys are set (stub otherwise). Live Stripe still requires human confirm (Q13).

## Phase 6 — commerce (Option B — dogfood Luna Bijoux)

Payment deferred: stop at `pending_payment` until Mestryx unlocks Stripe Capture. Detail: [12-commerce-fiscal-complete.md](./12-commerce-fiscal-complete.md).

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-060 | Commerce schema + admin products + public shop/cart/wishlist/checkout | feature | P0 | done | 12d | FB-041 |
| FB-061 | Orders ops: mark-paid, cancel+restock, invoice PDF/HTML, accounting CSV | feature | P0 | done | 5d | FB-060 |
| FB-062 | Product variants (size/color/SKU) | feature | P1 | done | 4d | FB-060 |
| FB-063 | Categories / collections | feature | P1 | done | 3d | FB-060 |
| FB-064 | Media gallery (R2/S3) | feature | P1 | done | 3d | FB-060 |
| FB-066 | Shipping zones / methods (real rates) | feature | P1 | done | 3d | FB-060 |
| FB-067 | Order emails (confirm / cancel / ship) | feature | P1 | done | 2d | FB-061 |
| FB-068 | Storefront customer accounts (email/password + Google OAuth) | feature | P1 | done | 4d | FB-060 |
| FB-072 | OAuth Apple (storefront, optional) | feature | P2 | done | 2d | FB-068 |
| FB-065 | Coupons / promotions | feature | P2 | done | 3d | FB-060 |
| FB-069 | Fulfillment + tracking | feature | P2 | done | 4d | FB-061 |
| FB-071 | Credit notes + reports / stock alerts | feature | P2 | done | 4d | FB-061 |
| FB-070 | Stripe Capture + webhooks + refunds (end-customer) | feature | P0 | deferred | 5d | FB-061 |
| FB-073 | Homepage / promo banners (storefront + admin merch) | feature | P1 | done | 3d | FB-034 |
| FB-074 | Storefront product search | feature | P1 | done | 3d | FB-060 |
| FB-075 | CMS blocks MVP + render `bodyJson` on storefront | feature | P1 | done | 5d | FB-034 |
| FB-076 | Cookie consent (EU) | feature | P0 | done | 2d | FB-041 |
| FB-077 | Legal pages beyond stubs (CGV / mentions) | feature | P0 | done | 2d | FB-041 |
| FB-078 | Customer address book at checkout | feature | P1 | done | 3d | FB-068 |
| FB-079 | Wishlist polish (remove, move-to-cart) | feature | P2 | done | 2d | FB-060 |
| FB-080 | Customer / guest order tracking UX | feature | P1 | done | 3d | FB-069 |
| FB-081 | Abandoned cart emails | feature | P2 | done | 3d | FB-067 |
| FB-082 | Returns / RMA | feature | P2 | done | 5d | FB-061 |
| FB-083 | PLP filters + sort (price, etc.) | feature | P1 | done | 3d | FB-063 |
| FB-102 | Storefront Soft boutique polish (drawer/cart/checkout/PDP/i18n patterns) | feature | P1 | done | 3d | FB-060, FB-038 |
| FB-103 | End-customer payment seams (ADR platform charge + nullable Stripe cols; no capture) | feature | P1 | done | 1.5d | FB-061 |
| FB-104 | Tracking + RMA UX polish (i18n status, carrier link, returns history, approve→credit-note) | feature | P1 | done | 2d | FB-080, FB-082 |

**Auth note (FB-068 / F-108 / F-110):** Better Auth `socialProviders`. Guest + email accounts; Google via `GOOGLE_*`; Apple via `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` (FB-072). Do not plan Facebook or X logins.

**Payment note:** FB-103 prepares schema/ADR for FB-070 without unlocking Stripe. Checkout stays `pending_payment` / `provider: "deferred"` until FB-070.

## Phase 7 — brand & motion

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-092 | Remotion marketing videos (CI pipeline) | feature | P1 | done | 4d | FB-033 |

## Phase 8 — platform gaps (admin / ops / trust)

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-084 | Module toggles UI (org/site + commerce) | feature | P1 | done | 3d | FB-032, FB-053 |
| FB-085 | Per-site theme tokens (logo/colors/fonts) | feature | P1 | done | 4d | FB-032, FB-037 |
| FB-086 | CMS media library | feature | P1 | done | 4d | FB-034, FB-064 |
| FB-087 | Staff preview unpublished pages | feature | P2 | done | 2d | FB-034 |
| FB-088 | Navigation menus (header/footer) | feature | P1 | done | 3d | FB-034 |
| FB-089 | Umami analytics (platform + per-site hook) | feature | P1 | done | 4d | FB-040 |
| FB-097 | Entitlements UX polish (limits / modules matrix) | feature | P2 | done | 2d | FB-053, FB-084 |
| FB-098 | Security headers / CSP defaults | feature | P0 | done | 1d | FB-041 |

## Phase 9 — go-to-market (CRE / AE)

| ID | Title | Type | Priority | Status | Est. | Depends |
|----|-------|------|----------|--------|------|---------|
| FB-105 | Marketing landing + legal packaging (Astro, FR+EN, Dokploy) | feature | P0 | doing | 3d | FB-033 |

**Branch:** `feat/marketing-landing-legal`. Host: `https://mestryx.dev`. Demos: `demo-admin-platform.mestryx.dev` · `demo-web-platform.mestryx.dev`. Plan: [plans/2026-08-03-go-to-market-foundations.md](./plans/2026-08-03-go-to-market-foundations.md).

## Icebox

| ID | Title | Type | Priority | Status |
|----|-------|------|----------|--------|
| FB-090 | Expo mobile MVP | feature | P2 | deferred |
| FB-091 | GraphQL facade | feature | P3 | deferred |
| FB-093 | SSO/SAML | feature | P3 | deferred |
| FB-094 | Rust worker | spike | P3 | deferred |
| FB-095 | AI page generator | feature | P3 | deferred |
| FB-096 | OAuth Facebook / X (Twitter) | feature | P3 | deferred |
| FB-099 | Super-admin Mestryx (F-208) | feature | P2 | deferred |
| FB-100 | Multi-locale site content (F-406) | feature | P2 | deferred |
| FB-101 | Product reviews (F-744) | feature | P3 | deferred |
