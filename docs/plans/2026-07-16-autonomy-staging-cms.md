# Autonomy staging CMS — condensed execution plan

> **Historical** — superseded by [feature-backlog.md](../feature-backlog.md) + [12-commerce-fiscal-complete.md](../12-commerce-fiscal-complete.md) + [13-journey-audit.md](../13-journey-audit.md). Do **not** sync status here.

**Date**: 2026-07-16  
**Source**: Cursor plan `autonomy_staging_cms` (do not edit the Cursor plan file).

## Scope

Dogfood CMS path to **staging-ready**: W0 gaps → W1 auth/tenancy → W2 admin → W3 SSR+SEO → W6 CMS light → W4 domain model → W5 Stripe test → Dokploy staging artifacts.

**Not in this run**: GraphQL, git subtrees, commerce, Expo, live Stripe, prod deploy without Mestryx.

## Waves

| Wave | Outcome |
|------|---------|
| A | Error JSON, request-id, Sentry stub, Redis client, env hosts, CI harden |
| B | Better Auth, org/site/domain schema, F-104 isolation, OpenAPI, sdk stub |
| C | admin + packages/ui/tokens + site CRUD + Playwright |
| D | TanStack Start web + host resolution + SEO/AI + CMS pages |
| E | Domain verify flow + platform host docs |
| F | Plans/entitlements + Stripe test webhooks |
| G | Dockerfiles + Dokploy staging runbook |

## Loop

`typecheck` + `test` + `build` green → commit → push. Isolation + SEO smoke when applicable.
