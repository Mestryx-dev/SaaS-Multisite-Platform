# Feature catalog & priority (Mestryx Multisite SaaS)

**Status**: Draft v1 · **Date**: 2026-07-16  
**Owner**: Mestryx · **Domain**: mestryx.dev  
**Sources**: Product goals from planning sessions; SaaS MVP practice 2026 (auth → core workflow → billing → admin → analytics → security/obs); multi-tenant launch checklists (isolation, webhooks, backups).

> **Assumption (A1)**: Core paid job = “run and manage multiple branded sites from one SaaS”. Commerce is a **module**, not the only MVP path — confirm in [08-open-questions.md](./08-open-questions.md).

Related: [07-dependency-graph.md](./07-dependency-graph.md) · [feature-backlog.md](./feature-backlog.md)

> **Owns:** F-* definitions, waves, Requires only. Executable status (`todo`/`doing`/`done`/`deferred`) lives **only** in [feature-backlog.md](./feature-backlog.md). Link FB rows with “Backlog: FB-xxx” — never annotate “done” here.

---

## 1. Priority legend

| Wave | Name | Rule |
|------|------|------|
| **W0** | Foundations | Blocks all product work; no UI value alone |
| **W1** | Tenant core | Cannot ship multi-site without this |
| **W2** | Admin console | Operators manage tenants/sites |
| **W3** | Public site runtime | End-users see something on a hostname |
| **W4** | Domains & brand | Custom domains + per-site theming |
| **W5** | Platform billing | Mestryx charges tenants (SaaS revenue) |
| **W6** | Content module | Pages/CMS beyond stubs |
| **W7** | Commerce module | Catalog → cart → pay (optional wave) |
| **W8** | Growth & ops | Analytics, email quality, i18n depth |
| **W9** | Brand & motion | Remotion CI, marketing site polish |
| **W10** | Mobile & advanced | Expo, API partners, GraphQL, white-label |
| **W11** | Later / AI | AI builder, module marketplace, Rust |

**Constraint principle**: A feature may not start until all `Requires` IDs are Done (or explicitly waived in ADR).

**Product principle (2026-07-17):** ship a **complete product** before public launch. Design system (Storybook), commerce depth, and Remotion belong in the main track. Staging, legal packaging, and go-live are **release gates** after completeness — not the default next step.

---

## 2. Actors & surfaces

| Actor | Surface | Host (planned) |
|-------|---------|----------------|
| Platform owner (Mestryx) | Super-admin (later) | `admin.mestryx.dev` |
| Tenant owner / staff | SaaS admin | `admin.mestryx.dev` |
| Site visitor / customer | Public site / storefront | `{site}.sites.mestryx.dev` or custom domain |
| Mobile user | Expo app | later |
| Partner / automation | Public API | `api.mestryx.dev` |

---

## 3. Feature catalog by wave

### W0 — Foundations

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-001 | Monorepo scaffold | pnpm + Turbo, apps/packages, Node 24 | — | All code | P0 |
| F-002 | CI pipeline | Lint, typecheck, unit, build on PR | F-001 | Deploys | P0 |
| F-003 | PostgreSQL + migrations | Versioned schema, migrate in CI/deploy | F-001 | All data | P0 |
| F-004 | Redis | Cache + job broker | F-001 | Jobs, rate limit | P0 |
| F-005 | Secrets management | No secrets in git; vault/env | F-001 | Prod | P0 |
| F-006 | API health | `GET /health` + structured logs | F-001 | Deploy gate | P0 |
| F-007 | Observability baseline | Sentry + JSON logs (+ OTEL later) | F-006 | Launch | P0 |
| F-008 | Env separation | dev / staging / prod keys & DBs | F-005 | Launch | P0 |
| F-009 | Backup policy | Automated PG backup + restore drill | F-003 | Launch | P1 |
| F-010 | Dependency pinning | Lockfiles + Dependabot/Renovate | F-001 | Security | P1 |

### W1 — Identity & multi-tenancy

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-100 | User accounts | Email/password, verify email, reset | F-003 | All authz | P0 |
| F-101 | Sessions / JWT | Secure session for admin; token for API | F-100 | Admin, API | P0 |
| F-102 | Organization (tenant) | Create org, slug, owner | F-100 | Sites | P0 |
| F-103 | Memberships & roles | owner / admin / editor / viewer (min) | F-102 | RBAC | P0 |
| F-104 | Tenant isolation | `organization_id` on all tenant rows + automated cross-tenant tests | F-102,F-003 | **Everything public** | P0 |
| F-105 | Audit log (auth) | Login fail/success, role change | F-100,F-103 | Compliance | P1 |
| F-106 | Rate limit auth | Login / reset throttling | F-004,F-100 | Security | P0 |
| F-107 | Invite members | Email invite → membership · Backlog: FB-035 (custom `organization_invite`, not Better Auth org plugin; roles admin/editor/viewer; `ADMIN_ORIGIN` accept URL) | F-103 | Team SaaS | P1 |
| F-108 | OAuth Google | Social login (Better Auth); **primary** social for storefront + optional admin DX · Backlog: FB-068 (env-gated) | F-100, F-718 | Storefront signup conversion | P1 |
| F-110 | OAuth Apple | Social login (Better Auth); iOS / privacy-conscious EU buyers · Backlog: FB-072 (env-gated web Services ID) | F-100, F-718 | Mobile / App Store | P2 |
| F-109 | SSO/SAML | Enterprise | F-103 | Enterprise sales | P3 |

**Social login policy (ecommerce):** guest checkout first; email/password (or magic link) for customer accounts; enable **Google** next; **Apple** when iOS share justifies it. **Out of scope:** Facebook/Meta and X (Twitter) — low ecommerce ROI, weak/unverified email signals, extra compliance surface. Max two social buttons on storefront UI.

### W2 — SaaS admin shell

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-200 | Admin app shell | Vite React, sidebar + top bar + Cmd-K | F-001,F-101 | All admin UX | P0 |
| F-201 | Workspace switcher | Switch active org | F-102,F-200 | Multi-org UX | P0 |
| F-202 | Site CRUD | Create/list/archive sites under org | F-102,F-104,F-200 | Runtime | P0 |
| F-203 | Site settings | Name, locale, timezone, status | F-202 | Domains, theme | P0 |
| F-204 | Module toggles | Enable/disable modules per org/site · Backlog: FB-084 | F-202 | Commerce/CMS gates | P1 |
| F-205 | User management UI | Invite, roles, remove · Backlog: FB-035 (admin `/members` + `/accept-invite`) | F-107,F-200 | Ops | P1 |
| F-206 | Design system package | `packages/ui` + tokens | F-001 | Consistent UI | P1 |
| F-207 | Storybook | Document `packages/ui` (completeness track) | F-206 | DS quality | P1 |
| F-208 | Super-admin (Mestryx) | Impersonate / global tenants view · Backlog: FB-099 (icebox) | F-104,F-200 | Support | P2 |

### W3 — Public site runtime

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-300 | Host resolution | `Host` → site → org | F-202,F-104 | All public | P0 |
| F-301 | Default subdomain | `{slug}.sites.mestryx.dev` | F-300, DNS | Preview sites | P0 |
| F-302 | Public layout | Theme tokens, nav, footer | F-300,F-206 | Pages | P0 |
| F-303 | Home + legal stubs | Home, privacy, terms placeholders · Backlog: FB-077 (beyond stubs) | F-302 | Launch legal | P0 |
| F-304 | SSR + SEO + AI discovery | TanStack Start; meta/OG/sitemap/robots/`llms.txt`/JSON-LD from first public page — [11-seo-ai-ready.md](./11-seo-ai-ready.md) | F-300 | SEO / GEO | **P0** |
| F-305 | Preview / draft | Staff preview unpublished content · Backlog: FB-087 | F-300,F-600 | CMS workflow | P2 |

### W4 — Domains & branding

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-400 | Custom domain record | Attach hostname to site | F-202,F-300 | Custom DNS | P0 |
| F-401 | Domain verification | DNS TXT (or HTTP) challenge | F-400 | Trust | P0 |
| F-402 | TLS provisioning | Auto cert (Caddy/Traefik/CF for SaaS) | F-401 | HTTPS custom | P0 |
| F-403 | Canonical redirect | apex ↔ www, http→https | F-402 | SEO | P1 |
| F-404 | Theme tokens per site | Colors, logo, fonts · Backlog: FB-085 | F-203,F-206 | Brand | P1 |
| F-405 | Favicon / OG images | Per-site assets (S3) | F-404,F-003 | Polish | P2 |
| F-406 | Multi-locale site | FR/EN content switch · Backlog: FB-100 (icebox) | F-203 | i18n product | P2 |

### W5 — Platform billing (Mestryx → tenant)

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-500 | Plans catalog | Free / Pro / Business feature matrix | F-102,F-204 | Entitlements | P0 |
| F-501 | Stripe Customer sync | Org ↔ Stripe Customer · Backlog: FB-051 (`ensureStripeCustomer` → `organization.stripeCustomerId`) | F-500 | Subs | P0 |
| F-502 | Checkout / Customer Portal | Subscribe, update payment method · Backlog: FB-051 (admin `/billing`; stub without keys) | F-501 | Revenue | P0 |
| F-503 | Webhooks: subscription lifecycle | created/updated/deleted + idempotency | F-501 | Access control | P0 |
| F-504 | Webhook: payment_failed | Dunning notify + soft lock | F-503 | Trust | P0 |
| F-505 | Entitlements enforcement | Plan limits (sites count, modules, seats) · Backlog: FB-053 + UX FB-097 | F-500,F-204,F-503 | Fair use | P0 |
| F-506 | Invoices / tax fields | Legal invoice data (EU) | F-502 | FR/EU | P1 |
| F-507 | Usage metering | Optional metered add-ons | F-505 | Scale pricing | P3 |
| F-508 | Commerce Stripe Connect | Tenant sells to end customers | F-700+ | Marketplace | P2 |

> **Constraint**: Do not enable live Stripe until F-503/F-504 tested with Stripe test clocks/cards.

### W6 — Content / CMS module

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-600 | Page model | Slug, status, SEO fields, site_id | F-202,F-104 | CMS | P0* |
| F-601 | Block editor (MVP) | Simple blocks or MDX · Backlog: FB-075 | F-600,F-200 | Content UX | P1 |
| F-602 | Publish pipeline | Draft → published + cache bust | F-600,F-300 | Live content | P0* |
| F-603 | Navigation menus | Header/footer links · Backlog: FB-088 | F-600 | IA | P1 |
| F-604 | Media library | Upload images to S3/R2 · Backlog: FB-086 | F-005,F-200 | Assets | P1 |
| F-605 | Forms / contact | Store submissions + email | F-600,F-800 | Leads | P2 |
| F-606 | Blog | Posts as page type | F-600 | Content | P2 |

\*P0 if CMS is the MVP core job; else start W7 instead — see open questions.

### W7 — Commerce module (full shop target)

> Complete checklist: [12-commerce-fiscal-complete.md](./12-commerce-fiscal-complete.md).  
> Internal trial: **one site** first; every row still has `site_id`.

| ID | Feature | Description | Requires | Priority |
|----|---------|-------------|----------|----------|
| F-700 | Products & categories | SKU, price, stock, status, media | F-202,F-104,F-204 | P0† |
| F-700a | Variants | Options → SKU/price/stock | F-700 | P0† |
| F-701 | PLP / PDP SSR | Listing & detail + Product JSON-LD | F-700,F-300 | P0† |
| F-702 | Cart (guest + user) | Session cart, merge on login | F-701,F-100 | P0† |
| F-709 | Wishlist | Save for later · Backlog: FB-060 + polish FB-079 | F-702,F-718 | P1 |
| F-703 | Checkout | Address → shipping → pay → confirm | F-702 | P0† |
| F-703a | Shipping methods | Zones / rates | F-703 | P0† |
| F-704 | Orders | UUID, history, emails | F-703 | P0† |
| F-705 | Inventory jobs | Decrement / low-stock · alerts via FB-071 (`low_stock_threshold`) | F-704,F-004 | P1 |
| F-706 | Coupons | % / fixed rules | F-703 | P1 |
| F-707 | Admin merchandising | Product CRUD UI | F-700,F-200 | P0† |
| F-708 | Refunds | Stripe + order state | F-704 | P1 |
| F-711 | Payment webhooks | Idempotent paid/failed/dispute | F-703 | P0† |
| F-714 | Fulfillment / tracking | Ship state + carrier ref · Backlog: FB-069 | F-704 | P1 |
| F-710 | Abandoned cart emails | Jobs + templates · Backlog: FB-081 | F-702,F-800 | P2 |
| F-716 | Returns / RMA | · Backlog: FB-082 | F-704 | P2 |
| F-744 | Product reviews | Ratings / comments on PDP · Backlog: FB-101 (icebox) | F-701,F-718 | P3 |
| F-718 | Customer accounts | Storefront buyers | F-100 or separate | P0† |
| F-730…F-739 | VAT + invoices + accounting export | See doc 12 | F-704,F-739 | P0† (EU) |
| F-750 | Commerce site settings | Currency, tax, origin | F-202 | P0† |

†Target when commerce module is active. Platform CMS can ship without these; **schema should anticipate** `site_id` + tax/order tables early to avoid repasse.

### W8 — Communications, analytics, i18n, compliance

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-800 | Transactional email | From `*@mestryx.dev`, SPF/DKIM/DMARC | F-005 | Auth emails | P0 |
| F-801 | Email templates | Verify, invite, order, invoice | F-800 | UX | P1 |
| F-802 | Product analytics (**Umami**) | Signup → activate → paid; per-site pageviews · Backlog: FB-089 | F-100,F-300 (sites) · F-502 when billing | Growth | P1 |
| F-802a | Umami: platform admin dashboard | Funnel events / page hits for `admin` + marketing · Backlog: FB-089 | F-802 | Ops | P1 |
| F-802b | Umami: per-tenant site tracking | Script/snippet per public site (optional module) | F-802,F-204 | Tenant insights | P2 |
| F-803 | Privacy / cookies | Consent if EU tracking · Backlog: FB-076 | F-303 | GDPR | P0 (EU) |
| F-804 | Data export / delete | GDPR subject requests | F-100,F-104 | Compliance | P1 |
| F-805 | Admin i18n | FR default / EN | F-200 | DX Mestryx | P1 |
| F-806 | Uptime monitor | External check + alert | F-006 | Ops | P1 |
| F-807 | Security headers / CSP | Prod defaults · Backlog: FB-098 | F-300 | Security | P0 |

### W9 — Brand & motion

| ID | Feature | Description | Requires | Priority |
|----|---------|-------------|----------|----------|
| F-A01 | Marketing site Astro | mestryx.dev product pages | F-001 | P2 |
| F-A02 | Remotion pipeline | Promo videos in CI · Backlog: FB-092 (social/ads MP4s; not store embeds) | F-206 | P1 |

### W10 — Mobile & partners

| ID | Feature | Description | Requires | Blocks | Priority |
|----|---------|-------------|----------|--------|----------|
| F-900 | OpenAPI + SDK | Generated client for admin/web/mobile | F-006 | Typed clients | P1 |
| F-901 | Partner API keys | Scoped tokens | F-900,F-103 | Integrations | P2 |
| F-902 | Expo mobile MVP | Login + sites/products read | F-900,F-101 | Mobile | P2 |
| F-903 | Push notifications | Expo push | F-902 | Engagement | P3 |
| F-904 | GraphQL facade | Optional | F-900 | Flexible queries | P3 |
| F-905 | White-label admin | Custom admin domain per tenant | F-402,F-200 | Agencies | P3 |

### W11 — Later / AI

| ID | Feature | Description | Requires | Priority |
|----|---------|-------------|----------|----------|
| F-A03 | AI site builder | Generate pages | F-601 | P3 |
| F-A04 | Module marketplace | Third-party modules | F-204 | P3 |
| F-A05 | Rust hot-path worker | Only if measured need | — | P3 |

---

## 4. Recommended sequencing

Executable order: [feature-backlog.md](./feature-backlog.md) § Sequencing.

1. Design system + Storybook (F-206 / F-207)  
2. Commerce completeness (W7 remaining)  
3. SaaS polish (invites, Customer Portal)  
4. Remotion CI (F-A02)  
5. Staging + launch checklist when the product is complete  

Fiscal model (tax classes, invoice numbering) stays in the order path from the first paid flow — see [12](./12-commerce-fiscal-complete.md).

---

## 5. Cross-cutting constraints (non-features that still gate launch)

| Constraint | Why | Related IDs |
|------------|-----|-------------|
| Isolation tests green | Tenant leak = company-ending | F-104 |
| Stripe failure webhooks | Revenue + trust | F-503, F-504 |
| Backups restored once | Recoverability | F-009 |
| No secrets in git | Security | F-005 |
| Legal pages accurate | EU/FR — **release gate**, not blocking completeness work | F-303, F-803 |
| Rate limits on auth | Abuse | F-106 |
| Staging ≠ prod keys | Safety — late gate after product completeness | F-008 |

---

## 6. Suggested hostname map (mestryx.dev)

| Host | App |
|------|-----|
| `mestryx.dev` | Marketing |
| `admin.mestryx.dev` | SaaS admin |
| `api.mestryx.dev` | API |
| `*.sites.mestryx.dev` | Tenant public sites |
| custom domains | Mapped via F-400+ |

Confirm DNS/SSL approach on Dokploy/Cloudflare in open questions.
