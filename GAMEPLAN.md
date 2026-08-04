# GAMEPLAN — Mestryx Multisite Platform

**Product name**: deferred (generic keys) · **Owner**: Mestryx · **Domain**: mestryx.dev · **GitHub**: Mestryx-dev  
**Updated**: 2026-07-18

## Objective

Ship a multi-tenant **CMS multi-brand** SaaS — many sites/domains, one admin — dogfood **Luna Bijoux** (Option B admin + storefront). Agent-friendly TS monorepo, Dokploy-ready. Commercial brand/domain can be chosen later.

## Phases

| Phase | Name | Outcome | Est. (solo + agents) |
|-------|------|---------|----------------------|
| 0 | Spec lock | App-spec, backlog, ADR, open questions answered | 3–7 days |
| 1 | Platform skeleton | Monorepo, CI, API health, DB, secrets | 1 week |
| 2 | Identity + tenancy | Auth, orgs, memberships, isolation tests | 2–3 weeks |
| 3 | Admin shell | SaaS nav, workspace switcher, site CRUD | 1–2 weeks |
| 4 | Site runtime SSR | Public TanStack Start + host + SEO/AI (`llms.txt`, JSON-LD) + CMS pages | 3–4 weeks |
| 5 | Domains | Custom domain verify + TLS path | 1–2 weeks |
| 6 | SaaS billing | Stripe subscriptions for platform plans | 1–2 weeks |
| 7 | Module: commerce | Shop completeness: coupons/fulfillment/credit notes **done**; Stripe Capture still deferred — [12](docs/12-commerce-fiscal-complete.md) · [backlog](docs/feature-backlog.md) | in progress |
| 8 | Hardening | Staging Dokploy + launch checklist (deferred until completeness) | later |
| 9 | Brand / DS | Storybook **done**; Remotion CI **done** (FB-092); Expo later | done |

**Uncertainty**: +20% on first Dokploy staging bring-up. All Q1–Q16 locked in [08-open-questions.md](docs/08-open-questions.md). See [10-agent-ops.md](docs/10-agent-ops.md), [11-seo-ai-ready.md](docs/11-seo-ai-ready.md).

## Risks

| Risk | Mitigation |
|------|------------|
| Scope explosion (all modules day 1) | Wave-gated backlog; one core job per phase |
| Tenant data leak | Isolation tests mandatory before any public site |
| Billing webhooks incomplete | Stripe test matrix before first paid tenant |
| Agent thrash across packages | AGENTS.md ownership; one app focus per sprint |
| Premature GraphQL / Expo | Still deferred; Remotion scaffold lives in `apps/remotion` |
| SPA public rewrite later | Locked TanStack Start + SEO/AI day one (docs/11) |

## Decision rights

| Decision | Owner |
|----------|--------|
| Product scope / pricing | Mestryx |
| Stack ADR | Mestryx (agent may draft; Mestryx accepts) |
| Production deploy | Mestryx explicit confirm |
| Secrets | Agent Vault / Infisical — never in git |

## Rollback principle

Every stateful change (migration, deploy, DNS, Stripe live mode) must document rollback in the relevant runbook before execution.
