# Open questions (Mestryx decisions)

**Status**: All product/infra questions for Phase 2–4 are **locked** (defaults below).  
Mestryx can override any lock with a short message; agents then update this file + ADR if needed.

## Product

| # | Question | Answer |
|---|----------|--------|
| Q1 | Commercial product name / dedicated domain? | **Working name `mestryx-platform`**. Fancy brand later. Hosts on mestryx.dev. Piblox = Studio only. |
| Q2 | MVP core job? | **CMS multi-brand**. Commerce = later module. |
| Q3 | Who pays first? | **Dogfood Mestryx first**. External billing after. |
| Q4 | First dogfood site? | **Greenfield** on the platform (nothing to migrate). |
| Q5 | Markets / languages? | **FR + EN** UI; code = English only. |

## Domains & infra

| # | Question | Answer |
|---|----------|--------|
| Q6 | Hostname map (prod)? | `platform.mestryx.dev` · `admin.mestryx.dev` · `api.mestryx.dev` · `*.sites.mestryx.dev` |
| Q7 | TLS for customer domains? | **Locked — phased**: (1) Platform hosts (`*.sites.mestryx.dev`) via **Dokploy/Traefik + Let’s Encrypt**. (2) Custom customer domains → **Cloudflare for SaaS** (or CF custom hostnames) when F-400+ lands. No half-TLS in prod. |
| Q8 | Deploy target? | **Dokploy** (Mestryx) |
| Q9 | Staging URL pattern? | **Locked**: `admin.staging.mestryx.dev` · `api.staging.mestryx.dev` · `*.sites.staging.mestryx.dev` · optional `platform.staging.mestryx.dev` |

## Stack

| # | Question | Answer |
|---|----------|--------|
| Q10 | Stack? | **Locked** — TypeScript monorepo (`docs/02-stack.md`) |
| Q11 | SSR / SEO day 1? | **Locked** — TanStack Start SSR + SEO/AI ([11-seo-ai-ready.md](./11-seo-ai-ready.md)) |
| Q12 | Auth? | **Better Auth** |

## Business / legal

| # | Question | Answer |
|---|----------|--------|
| Q13 | Company entity for Stripe? | **Locked for agents**: implement Stripe in **test mode** only until Mestryx supplies a legal entity + live keys. **No live Stripe** without explicit human confirm. |
| Q14 | VAT / EU invoices at MVP? | **Defer** until first external paid customer. Dogfood = no VAT invoices required. |
| Q15 | Privacy / ToS? | **Locked**: ship **draft** Privacy + ToS pages before any *external* signup; dogfood Mestryx-only may proceed with clearly marked drafts. External public launch blocked until Mestryx approves copy. |

## Brand (non-blocking)

| # | Question | Answer |
|---|----------|--------|
| Q16 | Brand visuals? | **Placeholders OK** until Mestryx validates visuals. Functional UI > polish. |

## Assumptions

| ID | Assumption |
|----|------------|
| A1 | CMS multi-brand is MVP core; commerce later |
| A2 | GitHub **Mestryx-dev** (personal) |
| A3 | Hosts under **mestryx.dev**; dedicated product domain later if needed |
| A4 | Stack = `docs/02-stack.md`; public = TanStack Start SSR |
| A5 | UI FR+EN; code English |
| A6 | Piblox ≠ this product |
| A7 | GraphQL / Rust / Web3 stay out of core; Storybook + Remotion are **completeness** work (not early-launch blockers) |
| A8 | SEO + `llms.txt` + JSON-LD with first public content |
| A9 | Staging hosts per Q9; prod per Q6 |
| A10 | Custom-domain TLS = Cloudflare for SaaS path (Q7) |
| A11 | Commit + push after green local/CI validation (agent ops) |

## What is “dogfood”? (Q4)

Using your own product for a real need. First site = **new greenfield site** on the platform (not a migration of an existing repo).

## Agent autonomy

Agents may proceed through **Phase 2–4** without further questions.  
**Still require Mestryx explicit confirm**: production deploy, live Stripe, deleting prod data/DNS, approving legal copy for external users.
