# MVP confirmation checklist — mestryx-platform

**Purpose:** Single human checklist of points Mestryx must **confirm** before treating the dogfood MVP as ready for **staging (FB-044)** and later **launch packaging (FB-045)**.

**Status:** Open — walk sections in order; tick only after live review.  
**Updated:** 2026-07-24  
**Owner:** Mestryx (human) · Agent may update ticks only after explicit “OK / confirmed”  
**Facilitation:** skill `human-review` (point-by-point: where / check / expected)

**Related SSOT**

| Doc | Role |
|-----|------|
| [feature-backlog.md](./feature-backlog.md) | FB-* status |
| [PROGRESS.md](../PROGRESS.md) | Thin gates |
| [brand-brief.md](./brand-brief.md) | Brand / visuals |
| [design-system/ux-ui-harmony-checklist.md](./design-system/ux-ui-harmony-checklist.md) | Deep DS V/C/P/M |
| [runbooks/staging-dokploy.md](./runbooks/staging-dokploy.md) | Staging ops |
| [runbooks/dev-dokploy-smoke.md](./runbooks/dev-dokploy-smoke.md) | Dev smoke hosts |
| [12-commerce-fiscal-complete.md](./12-commerce-fiscal-complete.md) | Commerce target scope |

**Surfaces**

| Surface | Local | Dev smoke (Dokploy 245) |
|---------|-------|-------------------------|
| Admin | `http://localhost:5174` | `https://dev-admin-platform.mestryx.dev` |
| Storefront (Luna) | `http://localhost:3002` | `https://dev-web-platform.mestryx.dev` |
| API | `http://localhost:3001` | `https://dev-api-platform.mestryx.dev` |
| Storybook | `http://localhost:6006` | `https://dev-storybook-platform.mestryx.dev` |

**Legend:** ☐ todo · ☑ confirmed · ✗ rejected (note) · — N/A / deferred by design

---

## 0. Scope lock (MVP cut)

Confirm this is the **accepted MVP boundary** (Option B commerce, Stripe end-customer capture still deferred).

- [x] **MVP cut** = multi-site CMS + admin console + Luna dogfood shop through **`pending_payment`** (no FB-070 live capture yet)
- [x] **Out of MVP** acknowledged: Expo (FB-090) later; marketing product name / dedicated domain not needed (vitrine); FB-070 unlock later
- [x] Working name **mestryx-platform** OK for engineering / DNS until marketing name
- [x] Piblox / Studio identity stays **separate** (no violet collision)
- [x] **Admin glass:** chrome already shipped (`.glass-chrome` top bar + sidebar brand) — human confirms OK / enough for MVP; extra Wave E (more glass) stays deferred

```
Blockers / notes (§0):
- Stripe / FB-070: later (2026-07-24)
- Expo: later
- Marketing name & dedicated domain: N/A for vitrine
- Glass chrome: OK for MVP; feels a bit flat — polish / deepen chrome later (not blocking)
- Colors / Piblox separation: keep current dual themes; palette may change later (not blocking)
```


---

## 1. Brand & design system (F-01)

Walk [brand-brief.md](./brand-brief.md) against live UI + Storybook.

### 1.1 Foundations

- [x] Platform theme (admin): dark dense console, accent/primary readable, not flat black soup
- [x] Storefront theme: Soft boutique (Luna), ambient wash OK, not cream-cliché / not Piblox
- [x] Typography: IBM Plex Sans body; Fraunces display on storefront only (agent-verified Dev: store Google Fonts Fraunces+Plex + `data-theme=storefront`; admin Inter + Plus Jakarta Sans in CSS)
- [x] Radius: platform ~8px · storefront Soft boutique also 8px (DESIGN.md / tokens; checklist “sharper” outdated — agent-verified Dev `--radius: 8px`)
- [x] Light + dark storefront toggle OK (contrast on Cart, badges, pills)
- [x] No purple SaaS / Inter / card-soup aesthetics

### 1.2 Storybook

- [x] Foundations / Themes look on-brand (Dev Storybook OK for MVP; deep catalog pass deferred)
- [x] Atoms Autodocs usable (MVP OK — full component walk later)
- [x] Patterns/ConsoleLayout + Patterns/Loading OK for admin density (MVP OK — deep pass later)
- [x] Storefront/Vitrine + Commerce (header dock, cart, PLP) OK (MVP OK — deep pass later)

### 1.3 Motion / chrome

- [x] Storefront header: flat at top → Soft glass floating dock on scroll (no thrash loop)
- [x] Cart drawer open/close OK; reduced-motion acceptable
- [x] Soft glass on chrome only (not product photos / primary CTAs)

**F-01 verdict**

- [x] **F-01 approved** — brand visuals OK for staging gate  
- [ ] Or: list blockers below before continuing

```
Blockers / notes:
Storybook full component catalog review deferred post-MVP (2026-07-25).
```

---

## 2. Admin console (operator)

Smoke as org admin on Luna / demo org.

### 2.1 Shell & auth

- [x] Sign in / sign up hierarchy clear; errors readable
- [x] Sidebar + top bar + **Cmd+K** routes to main pages
- [x] Org / workspace switcher clear — centered `topBarCenter` (Luna) after unified header polish 2026-07-25
- [ ] Density: list pages use PageContent + FilterBar + TableFrame (not FormPanel-as-filters)

### 2.2 Core ops pages

- [ ] Dashboard KPIs / queues readable (incl. mobile strip if checked) — KPI bullets vs target
- [ ] Sites CRUD / settings
- [ ] Products (+ variants if used) — selection + CSV export
- [ ] Categories
- [ ] Orders list: filters, URL sync, density, selection / bulk bar (CSV export; cancel stub OK)
- [ ] Order detail: mark-paid / cancel path understood (+ toast feedback)
- [ ] Pages / Menus / Media / Banners — empty CTAs where applicable
- [ ] Shipping zones
- [ ] Coupons
- [ ] Members / invites (+ toast on invite)
- [ ] Billing / modules / reports / returns (smoke)

### 2.3 Loading & empty

- [ ] List loading uses table skeletons (not broken spinner walls)
- [ ] Empty states understandable — title + primary CTA when an action exists
- [ ] Wide tables scroll horizontally on ~375px (TableFrame)
---

## 3. Storefront (customer — Luna)

### 3.1 Discovery

- [ ] Home vitrine: brand-first hero, collections, featured
- [ ] Category / search / PLP filters + sort
- [ ] PDP: gallery, price, ATC
- [ ] Header order (LTR): Shop… → Wishlist → Account → Theme → **Cart** (rightmost)

### 3.2 Cart & checkout

- [ ] Cart drawer + badge count
- [ ] Cart page editable
- [ ] Checkout → order reaches **`pending_payment`** (expected without FB-070)
- [ ] Guest + signed-in account paths OK
- [ ] Address book / wishlist / order tracking smoke OK

### 3.3 Trust & legal

- [ ] Cookie consent
- [ ] Legal pages (privacy / terms / legal) not stub-empty
- [ ] SEO basics: title/description/JSON-LD feel sane on home + PDP

---

## 4. Platform / tenancy (quick)

- [ ] Two orgs / sites cannot see each other’s data (isolation belief OK from dogfood + prior tests)
- [ ] Custom domain / subdomain story understood for staging (`*.sites…`)
- [ ] Platform billing stub / entitlements UX acceptable for MVP (Stripe test portal if keys set)

---

## 5. Engineering bar (before staging)

Agent can run; human confirms green or waives.

- [ ] `pnpm` typecheck / tests green for changed packages (or CI green)
- [ ] `pnpm ds:detect` clean on UI
- [ ] No secrets in git
- [ ] Latest commit on `main` reviewed (`feat(ds): admin console…` or successor)

---

## 6. Staging gate (FB-044) — confirm readiness

Do **not** deploy until section 1–5 are mostly ☑.

- [ ] Explicit **OK to deploy staging**
- [ ] DNS plan OK (`admin` / `api` / `*.sites` staging hosts)
- [ ] Secrets path OK (Agent Vault → Dokploy; never chat paste)
- [ ] Migrate + optional Luna seed accepted
- [ ] Stripe = **test mode only**; capture still deferred

Detail runbook: [runbooks/staging-dokploy.md](./runbooks/staging-dokploy.md)

---

## 7. Explicitly deferred (confirm “OK to leave out of MVP”)

- [ ] FB-070 Stripe Capture + refunds (end-customer)
- [x] Admin Wave E **extra** platform glass (beyond shipped `.glass-chrome` chrome) — defer; chrome OK for MVP but noted as a bit flat (polish later)
- [ ] Marketing product name / dedicated domain
- [ ] Expo mobile (FB-090)
- [ ] Full launch packaging FB-045 (isolation drills, backups, legal packaging) — **after** staging

---

## Sign-off

| Gate | Confirmed by | Date | Notes |
|------|--------------|------|-------|
| F-01 brand | Mestryx | 2026-07-25 | §1 OK; Storybook deep catalog later |
| MVP product smoke (admin + store) | | | |
| OK for FB-044 staging | | | |

When F-01 is confirmed, update:

1. This file (ticks + sign-off table)  
2. [PROGRESS.md](../PROGRESS.md) brand checkbox  
3. [ux-ui-harmony-checklist.md](./design-system/ux-ui-harmony-checklist.md) row **F-01** → `done`
