# Go-to-market foundations — mestryx-platform (Sept 2026 AE)

> English artifact. Product: SaaS multisite for merchants — **physical store + ecommerce** (omnichannel).  
> CRE uses dated proofs; AE target **2026-09**. Foundations first; deep feature work if time remains.

**Status:** Structure locked 2026-08-03 · **implementation in progress** on branch `feat/marketing-landing-legal`  
**Not legal advice.**

---

## Pitch (light)

**One line:** One admin, many sites — help a local shop sell **in-store and online** with shared catalog and stock.

**For whom:** Independent retailers / small chains (Isère → FR) who need a real storefront + a path to physical presence (click & collect / stock unified first; full POS later).

**Not:** Marketplace of many sellers · full POS cash register in v1 · spray open-source+premium before AE.

---

## Public URLs

| Host | Role |
|------|------|
| Marketing / product landing | `https://mestryx.dev` (**locked**) |
| Personal portfolio | `https://portfolio.mestryx.dev` (**locked** — move current portfolio site here) |
| Demo admin | `https://demo-admin-platform.mestryx.dev` |
| Demo storefront | `https://demo-web-platform.mestryx.dev` |
| Portfolio case study (interim) | `https://portfolio.mestryx.dev/projects/mestryx-platform` |
| Contact | `contact@mestryx.dev` |
| Umami (shared homelab) | `https://umami.mestryx.dev` — site IDs via env only (no UUIDs in docs) |

See also: [`docs/runbooks/dev-dokploy-smoke.md`](../runbooks/dev-dokploy-smoke.md).

---

## Landing page structure (`mestryx.dev`)

Ship a **shell** first (Astro in `apps/marketing`). Perfect copy later. **FR + EN** i18n from day one.

1. Hero — product name + one line (omni shop)
2. Problem — split tools for till vs web
3. Solution — multisite admin + storefront SSR + stock path
4. Demo CTAs — Admin · Boutique · “Voir le portfolio”
5. Roadmap strip — MVP now → click & collect → AE sept. 2026 → POS later
6. Footer — legal pages (mentions légales · privacy) **FR + EN** · contact `contact@mestryx.dev`

Out of first landing: pricing tables, premium feature matrix, open-source manifesto.

---

## Portfolio project stub

Add `content/projects/mestryx-platform.ts` on portfolio:

- Slug: `mestryx-platform`
- Case study Before / Mission / Résultat (omni angle)
- `liveUrl`: `https://mestryx.dev`
- Demo links: admin + web
- **No LMB**

---

## Omnichannel product scope (phased)

| Phase | By when | In scope |
|-------|---------|----------|
| A Foundations | Aug 2026 (CRE) | Landing shell · demo URLs live · BP · legal checklist |
| B Merchant MVP | Sept 2026 AE | 2 seed shops · admin usable · checkout pending_payment (Stripe later) |
| C Magasin léger | After AE | Unified stock · click & collect / pickup (not full POS) |
| D POS | Later | Explicitly deferred in [`12-commerce-fiscal-complete.md`](../12-commerce-fiscal-complete.md) §J |

---

## Legal checklist → AE September 2026

| Item | Target |
|------|--------|
| Micro-entreprise declaration (guichet unique) | Sept 2026 |
| Mentions légales + CGU draft on landing | Before public “offer” — **FR + EN** |
| RGPD / privacy notice (minimal) | Before collecting leads — **FR + EN** |
| ARE + micro cumul — ask FT counselor / ESTIME | Before first invoice |
| Stripe live / paid plans | After AE + counselor OK |
| Open source license decision | After AE (not CRE-critical) |

---

## Repo clean (foundations)

1. Align README + brand-brief hosts with URL map above  
2. Un-defer `apps/marketing` for landing shell + legal pages (Astro, FR+EN) — **in progress** (`feat/marketing-landing-legal`)
3. Document second seed shop for CRE “2 boutiques” claim  
4. Do **not** rewrite POS into v1 scope — pitch omni, build C after AE  
