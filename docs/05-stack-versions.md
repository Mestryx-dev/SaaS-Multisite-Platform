# Stack — library versions (2026)

**Survey date**: 2026-08-04  
**Source**: npm registry (`npm view <pkg> version`) + Node.js dist index.  
**Purpose**: For each layer in [02-stack.md](./02-stack.md), list the **chosen pick**, **latest version**, and optional library swaps *within the same TypeScript stack* (not a different product architecture).

> Versions move fast. Re-run `npm view <pkg> version` before locking `package.json`. Treat this as a decision matrix, not an eternal pin file.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **REC** | Recommended default for this platform (solo + AI agents + multi-tenant SaaS) |
| ALT | Strong alternative |
| AVOID | Usually wrong for this product shape (unless special case) |

---

## 1. Runtime & package manager

| Role | Package / product | Latest (survey) | Verdict | Notes |
|------|-------------------|-----------------|---------|-------|
| **REC** Runtime | **Node.js 24 LTS** (“Krypton”) | **v24.19.0** | Prefer for prod | Current LTS. Node Current (v26.x) — avoid for prod until LTS. |
| ALT Runtime | Node.js 22 | v22.22.x | OK | Previous LTS; fine if deps lag. |
| ALT Runtime | **Bun** | **1.3.14** | ALT for DX | Great for local/scripts; keep Node for prod Docker unless team owns Bun ops. |
| AVOID | Deno | — | Niche | Smaller hiring/agent corpus for SaaS APIs. |
| **REC** Workspace | **pnpm** | **11.20.0** | Prefer | Best monorepo defaults + disk efficiency. |
| ALT | npm / yarn | npm ships with Node | OK | npm workspaces OK; yarn less common in new 2026 kits. |
| **REC** Tasks | **Turborepo** | **2.10.8** | Prefer | Still the default JS monorepo task runner. |
| ALT | Nx | — | ALT | Heavier; better for huge orgs. |
| ALT | Moon | — | ALT | Less ecosystem gravity. |

---

## 2. API framework

| Role | Package | Latest | Verdict | When to pick |
|------|---------|--------|---------|--------------|
| **REC** | **Hono** | **4.13.0** (`@hono/node-server` **2.0.12**) | Prefer | Lean, Web Standards, great with agents, edge-ready, pairs with Zod OpenAPI. |
| ALT | **NestJS** (`@nestjs/core`) | **11.1.28** | ALT | Want explicit DI modules mirroring product modules; larger boilerplate. |
| ALT | **Fastify** | **5.10.0** | ALT | Max Node throughput + schema validation; less “battery included” than Nest. |
| ALT | **Elysia** | **1.4.29** | ALT | Bun-first; only if Bun is the runtime bet. |
| ALT | **Express** | **5.2.1** | Legacy OK | Still ubiquitous; slower DX/types than Hono/Fastify for greenfield. |
| AVOID | Adonis / Foal | — | Rare | Smaller TS SaaS mindshare. |

**Platform pick:** **Hono 4.13.x** + `@hono/node-server` 2.x for MVP; revisit NestJS only if module/DI discipline becomes painful.

---

## 3. Language & validation

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** | **TypeScript** | **7.0.2** | Prefer | Lock `"strict": true`. |
| **REC** Validation | **Zod** | **4.4.3** | Prefer | Zod 4 is current major; ecosystem catching up — verify peer ranges. |
| ALT | **Valibot** | **1.4.2** | ALT | Smaller bundle; fewer integrations than Zod. |
| ALT | **ArkType** | **2.2.3** | ALT | Excellent types; smaller community. |
| ALT | TypeBox / AJV | — | ALT | JSON Schema–first (Fastify style). |

---

## 4. Database & ORM

| Role | Package / product | Latest | Verdict | Notes |
|------|-------------------|--------|---------|-------|
| **REC** DB | **PostgreSQL 17** (or 16) | use official images `postgres:17` | Prefer | Multi-tenant SaaS standard. |
| **REC** ORM | **Drizzle ORM** | **0.45.2** | Prefer | SQL-shaped, fast, agent-friendly; `drizzle-kit` **0.31.10**. |
| ALT | **Prisma** | **7.8.0** | ALT | Strong migrations UX / Prisma Postgres; heavier client. |
| ALT | **Kysely** | **0.29.3** | ALT | Query builder only; max control. |
| AVOID | TypeORM | — | AVOID for greenfield | Seen as legacy vs Drizzle/Prisma in 2026 comps. |
| Driver | `postgres` (postgres.js) | **3.4.9** | REC with Drizzle | Or `pg` **8.22.0**. |
| Cache | **Redis** / **ioredis** | ioredis **5.11.1** | Prefer | Sessions, rate limits, BullMQ. |

---

## 5. Jobs / background work

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** | **BullMQ** | **5.80.5** | Prefer | Redis-backed; mature. |
| ALT | **Inngest** | **4.1.17** (npm) | ALT | Event/durable workflows; SaaS-friendly. |
| ALT | **Trigger.dev** (`@trigger.dev/sdk`) | check npm at lock time | ALT | Great DX; external dependency. |
| ALT | **Graphile Worker** / **pg-boss** | — | ALT | Postgres-only queues (no Redis). |
| AVOID | Ad-hoc `setInterval` in API | — | AVOID | No retries/observability. |

---

## 6. Auth & authorization

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** | **Better Auth** | **1.6.25** | Prefer | TS-native, plugins, multi-tenant friendly, active 2026. |
| ALT | **Clerk** (`@clerk/backend`) | **3.11.6** | ALT | Hosted IdP; faster start, vendor lock + cost. |
| ALT | **Auth.js** (`@auth/core` / next-auth) | next-auth **4.24.14** / Auth.js v5 line | ALT | Fine with Next; less ideal on pure Hono without care. |
| ALT | **Lucia** | **3.2.2** | Soft AVOID | Still on npm; Better Auth is the 2026 default successor path. |
| **REC** Authz | **CASL** (`@casl/ability`) | **7.0.1** | Prefer | Ability-based rules per tenant role. |
| ALT Authz | Custom RBAC tables | — | ALT | Simpler early; migrate to CASL when rules explode. |

---

## 7. API contract style (clients ↔ server)

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** Public + multi-client | **REST + OpenAPI 3.1** via **`@hono/zod-openapi`** | **1.5.1** | Prefer | Mobile + partners + OpenAPI SDK. ALT: `hono-openapi` **1.3.1**. |
| ALT First-party only | **oRPC** (`@orpc/server`) | **1.14.8** | Strong ALT | Type-safe RPC **with** OpenAPI story — rising 2026 pick vs tRPC. |
| ALT First-party only | **tRPC** (`@trpc/server`) | **11.18.0** | ALT | Excellent DX; weaker external/OpenAPI story than oRPC. |
| ALT Contracts | **ts-rest** (`@ts-rest/core`) | **3.52.1** | ALT | Contract-first REST. |
| Deferred | **GraphQL Yoga** | **5.21.2** | Later | Add when 3rd-party query flexibility is proven. |
| ALT GraphQL | Apollo Server | **5.5.1** | ALT | Heavier than Yoga for new APIs. |

**SDK generation**

| Tool | Latest | Verdict |
|------|--------|---------|
| **orval** | **8.22.0** | REC for React Query clients |
| **openapi-typescript** + **openapi-fetch** | **7.13.0** / **0.17.x** | ALT lighter |
| **@hey-api/openapi-ts** | **0.99.0** | ALT modern generator |
| GraphQL Codegen | — | Only if GraphQL |

---

## 8. Payments, email, files

| Role | Package / service | Latest | Verdict | Notes |
|------|-------------------|--------|---------|-------|
| **REC** Payments | **Stripe** (node) | **22.3.2** | Prefer | Checkout + Billing + webhooks. |
| ALT | Polar / Paddle / Lemon Squeezy | Polar SDK ~0.48 / Paddle node SDK | ALT | Merchant-of-record / SaaS billing variants. |
| **REC** Email | **Resend** | **6.17.2** | Prefer | DX + React Email. |
| ALT Email | SMTP / Nodemailer | **7.0.x** | ALT | Self-host / Mailpit in dev. |
| Templates | **react-email** | **5.x** line | REC with Resend | |
| **REC** Objects | S3 API (**R2** / MinIO / AWS) | `@aws-sdk/client-s3` **3.1088.0** | Prefer | |
| ALT Uploads | **UploadThing** | **7.7.4** | ALT | Fast DX; more opinionated. |

---

## 9. Observability & config

| Role | Package | Latest | Verdict |
|------|---------|--------|---------|
| **REC** Errors | **Sentry** (`@sentry/node`) | **10.65.0** | Prefer |
| **REC** Tracing | OpenTelemetry (`@opentelemetry/sdk-node`) | **0.220.0** | Prefer |
| Logs | **Pino** | **10.3.1** | Prefer |
| **REC** Env | **dotenvx** (`@dotenvx/dotenvx`) | **1.74.0** | ALT/REC | Encrypted env story; else plain `dotenv` **17.x**. |
| Product analytics | PostHog / Umami | posthog-js **1.402.3** | ALT | Prefer privacy-friendly Umami if already in stack. |

---

## 10. Admin & web (React)

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** Bundler | **Vite** | **8.1.4** | Prefer | Vite 8 is current (an earlier draft said Vite 6 — outdated). |
| Plugin | `@vitejs/plugin-react` | **6.0.3** | Prefer | |
| **REC** UI lib | **React** | **19.2.7** | Prefer | |
| **REC** CSS | **Tailwind CSS** | **4.3.2** | Prefer | Use `@tailwindcss/vite` **4.3.2**. |
| **REC** Components | **shadcn/ui** (CLI `shadcn`) | CLI **4.13.0** | Prefer | Copy into `packages/ui`; Radix/Base UI under the hood. |
| Icons | `lucide-react` | **1.24.0** | Prefer | |
| **REC** Routing (SPA admin) | **TanStack Router** | **1.170.18** | Prefer | Type-safe routes. |
| **REC** Server state | **TanStack Query** | **5.101.2** | Prefer | |
| Tables | **TanStack Table** | **8.21.3** | Prefer | |
| Forms | **React Hook Form** | **7.81.0** | Prefer | + Zod resolver. |
| URL state | **nuqs** | **2.8.x** | ALT/REC | Great for admin filters. |
| Toasts | **sonner** | **2.0.7** | Prefer | |
| Command palette | **cmdk** | **1.1.1** | Prefer | SaaSUI Cmd-K pattern. |
| **REC** Motion | **motion** (ex-Framer) | **12.42.2** | Prefer | Package name is `motion`; `framer-motion` same line. |
| i18n | **i18next** + **react-i18next** | **26.3.6** / **17.0.10** | Prefer | |
| ALT i18n | Paraglide (`@inlang/paraglide-js`) | **2.0.x** | ALT | Compile-time messages. |
| ALT i18n | next-intl | **4.4.0** | ALT | Only if Next.js. |

### Full-stack / SSR web (public sites — locked)

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** public | **TanStack Start** (`@tanstack/react-start`) | **1.168.28** | **Locked** | SSR + SEO/AI from day one ([11-seo-ai-ready.md](./11-seo-ai-ready.md)). |
| ALT public | **Next.js** | **16.2.10** | ALT | Only via new ADR. |
| ALT | React Router 7 framework mode | **react-router** **7.13.0** | ALT | SSR capable; fewer batteries. |
| AVOID for public content | Vite SPA-only | Vite **8.1.4** | AVOID | Admin may stay Vite SPA; public must not. |

---

## 11. Mobile

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** | **Expo** | **57.0.6** | Prefer | SDK 57; RN **0.86.0** in ecosystem. |
| Router | **expo-router** | **57.0.6** (aligned) | Prefer | File-based. |
| **REC** styling | **NativeWind** | **4.2.6** | Prefer | Tailwind mental model shared with web. |
| ALT styling | **Tamagui** | **2.4.5** | ALT | Stronger universal UI; steeper learning curve. |
| AVOID day-1 | Bare RN CLI only | RN **0.86.0** | AVOID | Expo is the 2026 default path. |

---

## 12. Marketing / motion / design system

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** Landing | **Astro** | **7.0.9** | Prefer | Content/marketing sites. |
| ALT Landing | Vite + React | — | ALT | If one stack only. |
| Video | **Remotion** | **4.0.489** | Optional | CI renders only. |
| Tokens | **Style Dictionary** | **5.5.0** | Prefer | CSS + RN outputs. |
| **REC** Docs UI | **Storybook** | **10.5.0** | Prefer | Storybook **10** (not 9). |
| A11y addon | `@storybook/addon-a11y` | **10.5.0** | Prefer | |
| Versioning pkgs | **Changesets** | **2.29.x** | Prefer if publish | |

---

## 13. Quality / lint / test

| Role | Package | Latest | Verdict | Notes |
|------|---------|--------|---------|-------|
| **REC** Lint+format | **Biome** | **2.5.4** | Prefer | Faster single tool for agents. |
| ALT | ESLint **10.7.0** + Prettier **3.9.5** | — | ALT | More plugins; slower. |
| ALT lint | Oxlint | **1.4.21** | ALT | Ultra-fast lint companion. |
| **REC** Unit | **Vitest** | **4.1.10** | Prefer | Vite-native. |
| DOM | happy-dom / jsdom | happy-dom **20.10.6** | Prefer happy-dom | Faster than jsdom for many suites. |
| Testing Lib | `@testing-library/react` | **16.3.2** | Prefer | |
| **REC** E2E | **Playwright** | **1.61.1** | Prefer | |
| Mocks | **MSW** | **2.12.x** | Prefer | |
| Hooks | Lefthook / Husky | lefthook **2.0.2** | ALT | Prefer Lefthook or bare CI. |

---

## 14. Recommended locked stack (pin targets)

Use these as the **default shopping list** when scaffolding (caret ranges OK; re-check on install day):

```text
Runtime:     Node 24.19.x LTS
Workspace:   pnpm 11.20.x + turbo 2.10.x
Language:    typescript 7.0.x + zod 4.4.x
API:         hono 4.13.x + @hono/node-server 2.0.x + drizzle-orm 0.45.x + bullmq 5.80.x
Auth:        better-auth 1.6.x + @casl/ability 7.x
Contract:    OpenAPI (Hono Zod OpenAPI) + orval 8.x
             (optional first-party: @orpc/server 1.14.x)
Admin/Web:   vite 8.2.x + react 19.2.x + tailwindcss 4.3.x
             + @tanstack/react-router 1.170.x + @tanstack/react-query 5.101.x
             + motion 12.x + shadcn CLI 4.x
Public SSR:  @tanstack/react-start 1.168.x   (Next 16.2.x only via ADR)
Mobile:      expo 57.x + nativewind 4.2.x
DS:          storybook 10.5.x + style-dictionary 5.5.x
Marketing:   astro 7.x + remotion 4.x (optional)
Quality:     biome 2.5.x + vitest 4.1.x + playwright 1.62.x
Payments:    stripe 22.x
Email:       resend 6.x
Obs:         @sentry/node 10.x + OTEL
DB:          PostgreSQL 17 + Redis 7/8
```

---

## 15. What changed vs earlier draft

| Old draft assumption | Updated 2026-07-16 reality |
|----------------------|----------------------------|
| Vite 5/6 | **Vite 8.1.x** |
| Storybook 9 | **Storybook 10.5.x** |
| Zod 3 mindset | **Zod 4.4.x** |
| Node 22 default | Prefer **Node 24 LTS** |
| Next 15 | **Next 16.2.x** (still ALT to TanStack Start) |
| tRPC as main ALT | **oRPC** often better if OpenAPI matters |
| Lucia as peer of Better Auth | Prefer **Better Auth**; Lucia soft-deprecated path |
| TypeScript 5.x | **TypeScript 7.0.x** on npm at survey time |
| Hono 4.12.x / node-server 1.x skew | **Hono 4.13.x** + `@hono/node-server` **2.0.x** everywhere |

---

## 16. Re-validation command

```bash
for p in hono @nestjs/core drizzle-orm prisma better-auth zod vite react \
  @tanstack/react-query @tanstack/react-router @tanstack/react-start \
  next expo storybook vitest @biomejs/biome turbo pnpm stripe resend motion; do
  printf '%-32s %s\n' "$p" "$(npm view "$p" version 2>/dev/null || echo N/A)"
done
```
