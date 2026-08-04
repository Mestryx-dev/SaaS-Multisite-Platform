# Agent guide — mestryx-platform

## Project

**mestryx-platform** — multi-brand CMS / multisite SaaS by **Mestryx**.

| | |
|---|---|
| GitHub | [Mestryx-dev/SaaS-Multisite-Platform](https://github.com/Mestryx-dev/SaaS-Multisite-Platform) |
| Hosts | Marketing `mestryx.dev` · demos `demo-*-platform.mestryx.dev` · `admin` / `api` / `*.sites` (see GTM plan) |
| Deploy | Dokploy (Mestryx) |
| Not this product | **Piblox** = Studio / AI video |

Commercial product brand/domain name is deferred; use working name **mestryx-platform** and generic host keys.

## Stack

TypeScript monorepo: **Hono + Drizzle + Better Auth + Tailwind**, shared UI in **`packages/ui`**.

| App | Choice |
|-----|--------|
| `apps/api` | Hono + Drizzle |
| `apps/admin` | Vite + React (SPA) |
| `apps/web` | **TanStack Start (SSR)** — SEO + AI discovery from first public page |

| Doc | Role |
|-----|------|
| `docs/technical-stack.md` | Short summary |
| `docs/02-stack.md` | Full stack |
| `docs/05-stack-versions.md` | Library versions & optional swaps |
| `docs/11-seo-ai-ready.md` | SSR / SEO / `llms.txt` / JSON-LD |
| `docs/10-agent-ops.md` | CI/CD, debug loop, learning loop |
| `docs/adr/0001-product-and-stack-direction.md` | Accepted decisions |

Do not add a second API stack or replace core choices without a new ADR accepted by Mestryx.

## Graphify (codebase map)

Knowledge graph at `graphify-out/` (`GRAPH_REPORT.md`, `graph.json`).

- **Before** architecture questions: read `graphify-out/GRAPH_REPORT.md`.
- **After** code/doc changes in MVP corpus:

  ```bash
  ./scripts/graphify-update.sh
  ```

  Install once: `uv tool install graphifyy` (CLI `graphify` on PATH).
  Corpus: `apps/{api,admin,web,marketing}`, `packages`, `docs`.

## Before implementing

1. `docs/10-agent-ops.md` — how agents work on this repo  
2. `docs/09-delivery-approach.md` — build order, `packages/ui` first, no-repasse  
3. `docs/06-feature-catalog-and-priority.md` + `docs/07-dependency-graph.md`  
4. `docs/08-open-questions.md` — stop and ask Mestryx if blocked by an open Q  
5. Never ship public sites without **tenant isolation tests** (F-104)  
6. Never ship public content as SPA-only shell — see `docs/11-seo-ai-ready.md`
7. Refresh Graphify when exploring unfamiliar areas (`./scripts/graphify-update.sh`)

## Architecture rules

- One REST API (`apps/api`); admin/web are clients  
- Reusable UI → **`packages/ui` immediately** (no extract-later)  
- Page-only UI → `apps/admin` or `apps/web`  
- Public HTML → **SSR** with meta, sitemap, robots, `llms.txt`, JSON-LD  
- Tenant rows scoped by `organization_id` / `site_id`  
- Code/comments/docs artifacts: **English**; chat with Mestryx: **French**  
- No secrets in git — see `docs/SECURITY.md`  
- YAGNI: no GraphQL, Expo, Stripe Capture, Umami until the wave/backlog says so  
- Remotion: installed at `apps/remotion` (FB-092 done) — `pnpm dev:remotion` / `pnpm render:remotion:all`; CI job `remotion` uploads social MP4 artifacts (not store embeds) 
- After hard fixes → append `docs/error-journal.md` (learning loop)  
- **Git**: prefer green `typecheck` + `test` + `build` before proposing commit/push (`docs/10-agent-ops.md` §2.1). Do not force-push protected branches without explicit maintainer OK.  
- **Docs sync**: every slice that changes behaviour/schema/API must update `docs/feature-backlog.md` first; `PROGRESS.md` only for phase-level milestones; OpenAPI / data-dictionary if contract/schema changed. Do **not** patch status into `docs/06`, `docs/12`, or `docs/13` — see `docs/10-agent-ops.md` §2.2 and `docs/README.md` ownership matrix. Stale backlog = incomplete slice.  
- Open questions are **locked** in `docs/08-open-questions.md` — proceed autonomously; only stop for prod deploy / live Stripe / legal publish / history rewrite / making the repo Public

## Local commands

```bash
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter @mestryx/api db:migrate   # when DB up
pnpm dev:api                            # http://localhost:3001/health
pnpm test
pnpm typecheck
pnpm build
```

## Key docs

| Need | Path |
|------|------|
| Product | `docs/app-spec.md` |
| Agent CI / debug / learn | `docs/10-agent-ops.md` |
| SEO + AI discovery | `docs/11-seo-ai-ready.md` |
| Delivery / UI policy | `docs/09-delivery-approach.md` |
| Features | `docs/06-feature-catalog-and-priority.md` |
| Backlog | `docs/feature-backlog.md` |
| Data | `docs/data-dictionary.yaml` |
| Plan | `GAMEPLAN.md` |
| Progress | `PROGRESS.md` |

## Contact

Maintainer: Mestryx (@Mestryx-dev)
