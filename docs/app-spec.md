# App Specification — Mestryx Multisite Platform

## Purpose

A Mestryx-operated SaaS that lets operators **create, brand, and operate multiple brand websites** from one console — CMS-first, with optional later modules (commerce, analytics, Web3). Hosts under `mestryx.dev` with generic keys for now; commercial product name/domain deferred.

## Target users

| Persona | Goal |
|---------|------|
| **Tenant owner** | Run one or many sites; invite staff; pay a Mestryx plan |
| **Tenant editor** | Edit content / products for assigned sites |
| **Site visitor** | Browse site (and optionally buy) on subdomain or custom domain |
| **Platform operator (Mestryx)** | Support tenants, monitor health, manage plans |

## Core features (product level)

1. Organizations (tenants) with roles  
2. Multiple sites per org with host-based routing  
3. SaaS admin console (sidebar + workspace switcher)  
4. Custom domains + TLS  
5. Modular capabilities (CMS and/or commerce)  
6. Platform subscription billing (Stripe)  
7. Secure multi-tenant isolation  

Detail & priority: [06-feature-catalog-and-priority.md](./06-feature-catalog-and-priority.md).

## Success criteria (complete product)

Runnable dogfood remains useful locally; **public launch** waits until the completeness track in [feature-backlog.md](./feature-backlog.md) is largely Done.

- [ ] Two sites under one org resolve on different hosts without data leak  
- [ ] Admin can CRUD sites, CMS pages, and commerce catalog (incl. categories / variants)  
- [x] Design system documented in Storybook  
- [ ] Storefront flows cover media, shipping, order email, and customer accounts as scoped  
- [x] Remotion CI promo pipeline available for marketing (scaffold in `apps/remotion`; CI job `remotion` + artifact `remotion-promos`)  
- [ ] Custom domain verify + HTTPS works for at least one test domain  
- [ ] Stripe test-mode subscription gates a plan limit (e.g. max sites)  
- [ ] Sentry receives a test error; `/health` green  
- [ ] Isolation automated tests pass in CI  

## Out of scope (core platform)

- Native mobile app (wave W10)  
- GraphQL, AI site builder, module marketplace  
- SSO/SAML  
- Rust services  
- Multi-region active-active  
- Legal packaging & staging deploy until completeness gate  

## Non-goals

- Rebranding or depending on any third-party “boilerplate brand”  
- Company GitHub org (use personal **Mestryx-dev** for now)  
- Optimizing for earliest possible public launch over product completeness  
