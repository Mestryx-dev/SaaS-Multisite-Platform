# ADR-0001: Product direction and technical stack

**Status**: Accepted  
**Date**: 2026-07-16

## Context

Mestryx builds a multi-tenant multisite CMS SaaS (`mestryx-platform`) on personal GitHub Mestryx-dev, deployed on Dokploy, hosts under mestryx.dev.

## Decision

1. **Working name**: `mestryx-platform`. Fancy commercial brand/domain deferred.  
2. **Owner**: Mestryx; repos on **Mestryx-dev**.  
3. **Hosts**: `platform.mestryx.dev`, `admin.mestryx.dev`, `api.mestryx.dev`, `*.sites.mestryx.dev`.  
4. **Deploy**: Dokploy (Mestryx homelab).  
5. **Stack**: TypeScript monorepo — Hono, Drizzle, Better Auth, Vite/React (admin), **TanStack Start (public SSR)**, Tailwind, shared UI in `packages/ui`. Details in `docs/02-stack.md` and `docs/05-stack-versions.md`.  
6. **Public SEO / AI**: Full SEO + AI discovery (`llms.txt`, JSON-LD, sitemap, OG) from the first public page — no SPA-first rewrite ([11-seo-ai-ready.md](../11-seo-ai-ready.md)).  
7. **MVP**: CMS multi-brand; first site greenfield dogfood. Commerce / Web3 later.  
8. **Sibling brand**: Piblox remains Studio/AI video only.  
9. **Scope**: Feature waves in `docs/06` / `docs/07`; delivery in `docs/09`; agent ops in `docs/10-agent-ops.md`.  
10. **Infra defaults**: Staging hosts Q9; TLS platform via Traefik/LE, custom domains via Cloudflare for SaaS (Q7). See `docs/08-open-questions.md`.  
11. **Billing/legal**: Stripe test-mode until entity + human live confirm; draft legal OK for dogfood.

## Consequences

- Single clear stack for agents and humans.  
- Public sites start on TanStack Start (SSR); admin stays Vite SPA.  
- Agents may execute Phase 2–4 autonomously; prod deploy / live Stripe still need Mestryx.  
- Next: Phase 2 auth + tenancy; Phase 4 must include SEO/AI acceptance checks.
