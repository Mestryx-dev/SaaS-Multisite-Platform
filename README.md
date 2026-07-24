# Mestryx Multisite Platform

Multi-brand CMS / multisite SaaS by **Mestryx** (`mestryx.dev`) — TypeScript monorepo.

| | |
|---|---|
| **Working name** | **mestryx-platform** (marketing brand later if needed) |
| **Owner** | Mestryx (Florian) — personal GitHub [`Mestryx-dev`](https://github.com/Mestryx-dev) |
| **Hosts (early)** | `admin` / `api` / `*.sites` on `mestryx.dev` |
| **Repo** | [`Mestryx-dev/SaaS-Multisite-Platform`](https://github.com/Mestryx-dev/SaaS-Multisite-Platform) |
| **Phase** | Autonomy waves A–G implemented locally; staging deploy awaits Mestryx DNS/Dokploy |
| **Stack** | TypeScript modular monorepo — see `docs/02-stack.md`. |
| **Not this product** | Piblox = Studio / AI video |

## Goals

- Many public **sites** / custom **domains**, one **SaaS admin**
- Modular product (CMS, catalog/commerce, billing, analytics — toggles per tenant)
- Shared **design system**, web clients, later **mobile**
- Built primarily with **AI agents** under clear ADRs and a prioritised backlog
- Deployed on Mestryx infrastructure (Dokploy / self-hosted), secrets via vault — not a third-party “company org” for now

## Docs (start here)

| Doc | Purpose |
|-----|---------|
| [docs/README.md](docs/README.md) | Full index |
| [docs/app-spec.md](docs/app-spec.md) | Product purpose & users |
| [docs/06-feature-catalog-and-priority.md](docs/06-feature-catalog-and-priority.md) | Features, waves, constraints |
| [docs/07-dependency-graph.md](docs/07-dependency-graph.md) | What blocks what |
| [docs/08-open-questions.md](docs/08-open-questions.md) | Locked decisions |
| [docs/02-stack.md](docs/02-stack.md) | Technical stack (detail) |
| [docs/11-seo-ai-ready.md](docs/11-seo-ai-ready.md) | SSR + SEO + AI discovery |
| [docs/10-agent-ops.md](docs/10-agent-ops.md) | CI/CD, debug & learning loops |
| [docs/runbooks/staging-dokploy.md](docs/runbooks/staging-dokploy.md) | Staging deploy (human gates) |
| [docs/runbooks/dev-dokploy-smoke.md](docs/runbooks/dev-dokploy-smoke.md) | Dev smoke on Dokploy 245 |
| [GAMEPLAN.md](GAMEPLAN.md) | Phases, risks, estimate |
| [PROGRESS.md](PROGRESS.md) | Spec checklist |

## Layout

```
apps/api          # Multi-tenant API
apps/admin        # SaaS console (*.mestryx.dev)
apps/web          # Public SSR sites + SEO/AI surfaces
apps/remotion     # Remotion 4 promo videos (Studio + render)
apps/mobile       # Expo (later)
apps/marketing    # Astro marketing site (deferred)
packages/ui|tokens|sdk|config
docs/             # Source of truth (this phase)
```

## Phase 1 — local skeleton

```bash
cp .env.example .env
docker compose up -d          # Postgres 17 + Redis 7
pnpm install
pnpm --filter @mestryx/api db:generate
pnpm --filter @mestryx/api db:migrate
pnpm dev:api                  # http://localhost:3001/health
pnpm test
```

Hosts (later on Dokploy): `admin.mestryx.dev` · `api.mestryx.dev` · `*.sites.mestryx.dev`

## Licence

Private — Mestryx-dev. TBD formal licence string.
