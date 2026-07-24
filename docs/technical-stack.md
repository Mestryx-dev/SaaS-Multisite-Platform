# Technical stack — mestryx-platform

**Status**: Canonical  
**Detail**: [02-stack.md](./02-stack.md) · versions: [05-stack-versions.md](./05-stack-versions.md) · ADR: [adr/0001-product-and-stack-direction.md](./adr/0001-product-and-stack-direction.md)

## Implemented today (Phase 1)

| Area | Choice |
|------|--------|
| Monorepo | pnpm + Turborepo |
| API | Hono + TypeScript + Drizzle |
| DB / cache (local) | PostgreSQL 17 + Redis 7 (Docker Compose) |
| CI | GitHub Actions (typecheck, test, build) |
| Deploy target | Dokploy (Mestryx) |

## Target stack (continue building)

| Area | Choice |
|------|--------|
| Auth | Better Auth |
| Admin | Vite + React + Tailwind 4 |
| Public sites | **TanStack Start** (SSR) + SEO/AI discovery ([11](./11-seo-ai-ready.md)) |
| Shared UI | `packages/ui` (primitives from first screen) |
| Tokens | `packages/tokens` |
| API client | `packages/sdk` (OpenAPI) |
| Jobs | BullMQ + Redis |
| Payments | Stripe (billing wave) |
| Analytics | Umami (after public sites) |
| Obs | Sentry + structured logs |
| Hosts | `admin` / `api` / `*.sites` on mestryx.dev |

## Architecture

Modular monolith API + separate frontends. Shared-schema multi-tenancy with isolation tests. Host-based public site routing.

## Standards

- TypeScript strict  
- English for code and persistent docs  
- Secrets out of git  
- See [09-delivery-approach.md](./09-delivery-approach.md)
