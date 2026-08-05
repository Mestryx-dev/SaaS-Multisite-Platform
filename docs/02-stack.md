# Technical stack — detail (mestryx-platform)

**Status**: Canonical  
**Philosophy**: TypeScript monorepo on `mestryx.dev` — API, admin, public sites, shared UI/tokens/SDK. GitHub: Mestryx-dev.

## 1. Summary

**pnpm + Turborepo** monorepo: apps (`api`, `admin`, `web`, `marketing`, `remotion`, later `mobile`) and packages (`ui`, `tokens`, `sdk`, `config`).

Shared UI primitives live in **`packages/ui` from the first admin screen** (see [09-delivery-approach.md](./09-delivery-approach.md)).

## 2. Stack

> Versions and library alternatives: [05-stack-versions.md](./05-stack-versions.md) (survey 2026-07-16).  
> Short summary: [technical-stack.md](./technical-stack.md).

### 2.1 API — `apps/api`

| Layer | Choice |
|-------|--------|
| Runtime | Node.js 22+ (target 24 LTS in prod) |
| Framework | **Hono** |
| Language | TypeScript strict |
| ORM | **Drizzle ORM** + drizzle-kit |
| DB | PostgreSQL 17 |
| Cache / queues | Redis + BullMQ (when jobs land) |
| Auth | **Better Auth** (email/password; Google → Apple social; not Facebook/X) |
| Authz | CASL (or simple RBAC until needed) |
| API style | REST + OpenAPI (`@hono/zod-openapi`) |
| Validation | Zod |
| Payments | Stripe (platform billing wave) |
| Files | S3-compatible (R2 / MinIO / AWS) |
| Email | Resend + React Email (or SMTP) |
| Observability | Sentry + structured logs (+ OTEL later) |
| Deploy | Docker → **Dokploy (Mestryx)** |
| Workspace | pnpm + Turborepo |

### 2.2 Admin — `apps/admin`

| Layer | Choice |
|-------|--------|
| Build | Vite + `@vitejs/plugin-react` |
| UI | React + TypeScript |
| Styling | Tailwind CSS 4 |
| Components | shadcn patterns → **`packages/ui`** |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Nav | Sidebar + top bar + command palette |
| i18n | i18next / react-i18next (EN keys; FR+EN catalogs) |

### 2.3 Public sites — `apps/web`

| Layer | Choice |
|-------|--------|
| Framework today | **Hono + React `renderToString`** (SSR) consuming `@mestryx/ui` |
| ADR target | **TanStack Start** (later rewrite — not blocking the internal trial) |
| SEO / AI discovery | Meta, canonical, OG, sitemap, robots, `llms.txt`, JSON-LD — see [11-seo-ai-ready.md](./11-seo-ai-ready.md) |
| Theming | `data-theme="storefront"` + CSS variables from `packages/tokens` |
| ALT (only via new ADR) | Next.js 16 |

### 2.4 Mobile — `apps/mobile` (later)

Expo + Expo Router + NativeWind; same API/SDK.

### 2.5 Marketing — `apps/marketing`

| Layer | Choice |
|-------|--------|
| Framework | **Astro** (static / SSG landing) |
| i18n | FR + EN catalogs — `apps/marketing/src/i18n/{fr,en}.json` |
| Deploy | Docker → **Dokploy (Mestryx)** — `https://mestryx.dev` |
| Status | In progress — branch `feat/marketing-landing-legal` (FB-105) |

Product landing, legal stubs (mentions / privacy), demo CTAs. See [go-to-market plan](./plans/2026-08-03-go-to-market-foundations.md).

### 2.6 Video — `apps/remotion`

| App | Role |
|-----|------|
| `apps/remotion` | Remotion **4.0.489** brownfield (`registerRoot` + Studio + render) — [apps/remotion/README.md](../apps/remotion/README.md) · FB-092 |

### 2.7 Design system

| Package | Role |
|---------|------|
| `packages/ui` | Shared primitives + storefront compositions |
| `packages/tokens` | Dual theme: `platform` / `storefront` |
| Storybook | **FB-036 done** — `pnpm --filter @mestryx/ui storybook` |

### 2.8 API client — `packages/sdk`

OpenAPI → orval (or openapi-typescript). One contract for admin, web, mobile.

### 2.9 GraphQL

Not in MVP. REST + OpenAPI only unless a later ADR says otherwise.

### 2.10 Quality

Biome (or tsc lint for now), Vitest, Playwright (when UI E2E), Turbo CI, MSW for mocks.

## 3. Repository layout

```
SaaS-Multisite-Platform/
├── apps/api|admin|web|mobile|marketing
├── packages/ui|tokens|sdk|config
├── turbo.json
├── pnpm-workspace.yaml
└── docs/
```

## 4. Product modules (API)

| Module | Responsibility |
|--------|----------------|
| `tenancy` | Orgs, sites, domains, host resolution |
| `identity` | Users, sessions, RBAC |
| `cms` | Pages, blocks, SEO |
| `billing` | SaaS plans, Stripe |
| `commerce` | Optional later |
| `notifications` | Email, push |
| `analytics` | Umami / events |

Under Hono: `src/modules/<name>/`.

## 5. Multi-tenancy

- `organization_id` / `site_id` on tenant rows  
- Host → site → org resolution for public traffic  
- Workspace switcher in admin  
- Cross-tenant isolation tests before public features  

## 6. Delivery phases

| Phase | Outcome |
|-------|---------|
| 0 | Specs + ADR (done) |
| 1 | Monorepo + API health + Docker + CI (done) |
| 2 | Better Auth + orgs + isolation tests |
| 3 | Admin shell + `packages/ui` primitives |
| 4 | Public SSR runtime + host resolution + SEO/AI surfaces |
| 5 | Custom domains + TLS |
| 6 | Platform billing (Stripe) |
| 7 | CMS pages module (SEO fields from first page model) |
| 8 | Umami / polish; commerce optional; mobile later |

## 7. MVP success criteria

- [ ] CI green for api (+ admin when present)  
- [ ] Two sites under one org, isolated  
- [ ] Admin can CRUD sites  
- [ ] Public home SSR by host (HTML has title/content, not empty shell)  
- [ ] SEO smoke: robots, sitemap, llms.txt, JSON-LD  
- [ ] Shared UI imported from `packages/ui`  
