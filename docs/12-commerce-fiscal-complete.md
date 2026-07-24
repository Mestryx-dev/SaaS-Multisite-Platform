# Complete commerce + fiscal scope (target product)

**Owns**: Target shop/fiscal **scope** only. Status → [feature-backlog.md](./feature-backlog.md) (FB-060+). Journeys → [13-journey-audit.md](./13-journey-audit.md).  
**Date**: 2026-07-16  
**Rule**: Plan the **full shop** so schema/API/UI do not need a rewrite later. Build in waves; dogfood can start with **one site**.

**Locked with Mestryx (2026-07-16):**

- **Option B**: admin product management + full ecommerce storefront in parallel (not “CMS-only then shop”).  
- **Payment deferred**: stop at `pending_payment` orders (no Stripe until unlocked).  
- **Autonomy**: agent executes defaults from this doc + catalog; only escalate for prod deploy, live Stripe, or legal publish.

Related: [06-feature-catalog-and-priority.md](./06-feature-catalog-and-priority.md) · [feature-backlog.md](./feature-backlog.md) · [13-journey-audit.md](./13-journey-audit.md) · [data-dictionary.yaml](./data-dictionary.yaml)

## Product shape

| Layer | Meaning |
|-------|---------|
| **Platform billing (W5)** | Tenant pays Mestryx (SaaS plan) |
| **Commerce (W7+)** | End-customer buys on a **site** (storefront) |
| **Fiscal / accounting** | VAT, invoices, exports for the **merchant** (tenant org) and optionally platform |

**Catalog model:** products belong to the **organization** first. `site_id` is optional — null = catalog only; set `site_id` to publish on that storefront. Public shop = site root `/` (not `/shop`).

---

## A. Catalog (admin + public)

| ID | Feature | Notes |
|----|---------|-------|
| F-700 | Products CRUD | name, slug, description, status, SEO fields |
| F-700a | Variants | size/color/SKU matrix; price/stock per variant |
| F-700b | Categories / collections | tree or tags; assign products |
| F-700c | Media gallery | images/video; primary image; S3/R2 |
| F-700d | Pricing | price_cents, compare-at, currency, tax class |
| F-700e | Inventory | stock, reserved, low-stock threshold, backorder flag |
| F-700f | Digital goods (opt) | downloadable files / license keys |
| F-707 | Admin merchandising UI | full CRUD + bulk edit |
| F-701 | PLP / PDP | SSR listing + detail + JSON-LD Product |

---

## B. Cart, wishlist, checkout

| ID | Feature | Notes |
|----|---------|-------|
| F-702 | Cart guest + logged-in | cookie/session; merge on login |
| F-702a | Cart line items | variant, qty, price snapshot |
| F-709 | Wishlist / save-for-later | per customer account or guest token · Backlog: FB-060 + FB-079 |
| F-703 | Checkout | address → shipping → payment → confirm |
| F-703a | Shipping methods | flat / weight / zones; rates per site |
| F-703b | Shipping address book | customer saved addresses · Backlog: FB-078 |
| F-703c | Billing ≠ shipping | optional |
| F-703d | Order notes / gift message | |
| F-706 | Coupons / promotions | % or fixed, min cart, expiry, usage limits · Backlog: FB-065 |
| F-706a | Gift cards (later) | |
| F-710 | Abandoned cart emails | jobs + templates · Backlog: FB-081 |

---

## C. Payments (end-customer)

| ID | Feature | Notes |
|----|---------|-------|
| F-508 | Stripe Connect or platform charge | decide: Mestryx collects vs Connect to tenant |
| F-703e | Card / wallet checkout | Stripe Payment Element (test then live) |
| F-708 | Refunds / partial refunds | Stripe + order state machine |
| F-711 | Payment webhooks | idempotent; paid / failed / dispute |
| F-712 | 3DS / SCA | EU required |
| F-713 | Multi-currency (later) | display + settle |

**Default assumption (change with ADR):** Stripe **test** first; live needs legal entity (Q13). Prefer **Stripe Checkout / PaymentIntents** per site with Connect when tenants are external merchants.

---

## D. Orders & fulfillment

| ID | Feature | Notes |
|----|---------|-------|
| F-704 | Orders | public UUID, status machine, line items snapshot |
| F-704a | Order admin UI | filter, detail, timeline |
| F-704b | Customer order history | account area on site |
| F-705 | Inventory decrement | on paid / on capture |
| F-714 | Fulfillment | packing, tracking number, carrier · Backlog: FB-069 |
| F-715 | Shipping labels (later) | EasyPost / Mondial Relay / Colissimo |
| F-716 | Returns / RMA | request → approve → refund/exchange · Backlog: FB-082 |
| F-717 | Order emails | confirm, ship, cancel, refund |

---

## E. Customers (storefront accounts)

| ID | Feature | Notes |
|----|---------|-------|
| F-718 | Customer accounts | distinct from SaaS admin users **or** shared identity with role · Backlog: FB-068 |
| F-719 | Guest checkout | email required; optional account create (keep guest path) |
| F-720 | Password reset / magic link | |
| F-721 | GDPR export/delete for customers | F-804 |
| F-108 | OAuth Google | Primary social IdP · Better Auth · with FB-068 |
| F-110 | OAuth Apple | Optional second social · Backlog: FB-072 (env-gated web Services ID) |

**Default:** storefront **customer** table per org/site; SaaS admin users stay platform-side.

**Social policy:** guest → email account → Google → Apple (if needed). Do **not** add Facebook or X. Max two social buttons on storefront.

---

## F. VAT, invoicing, accounting (EU / FR)

| ID | Feature | Notes |
|----|---------|-------|
| F-730 | Tax classes | standard / reduced / zero / exempt |
| F-731 | VAT rates by country | FR 20%/10%/5.5%/2.1%; EU OSS later |
| F-732 | Tax calculation at checkout | based on ship-to (B2C) or VAT ID (B2B) |
| F-733 | Intra-EU B2B reverse charge | validate VIES VAT number |
| F-734 | Fiscal invoices (facture) | sequential numbers per org/site legal entity |
| F-735 | Credit notes | linked to invoice · Backlog: FB-071 (fiscal only; Stripe = FB-070) |
| F-736 | Invoice PDF | legal mentions, SIRET/VAT, address |
| F-737 | Accounting export | FEC-like CSV / journal lines (date, account, debit/credit, VAT) |
| F-738 | Chart of accounts mapping | sales, VAT collected, shipping, discounts |
| F-739 | Merchant legal profile | company name, SIRET, VAT ID, address, capital, RCS |
| F-740 | OSS / IOSS (later) | when selling cross-EU at scale |
| F-506 | Platform SaaS invoices | already in W5 for Mestryx→tenant |

**Not in v1 code:** full ERP / Sage sync. Export + correct invoices is enough for many FR SMEs + accountant.

---

## G. Compliance & trust

| ID | Feature | Notes |
|----|---------|-------|
| F-303 | Legal pages | CGV, privacy, legal notice, cookies |
| F-803 | Cookie consent | if analytics/ads |
| F-741 | Right of withdrawal | EU 14-day (digital exceptions) |
| F-742 | Age / restricted goods (opt) | |
| F-743 | Fraud signals | Stripe Radar; velocity limits |

---

## H. Ops & admin (commerce)

| ID | Feature | Notes |
|----|---------|-------|
| F-750 | Site commerce settings | currency, tax mode, shipping origin |
| F-751 | Module toggle `commerce` | F-204 |
| F-752 | Reports | sales, VAT collected · Backlog: FB-071 (top products later) |
| F-753 | Stock alerts | admin list via `low_stock_threshold` · Backlog: FB-071; Discord later |
| F-754 | Multi-site product copy (later) | publish same SKU to N sites |

---

## I. Build order (recommended)

**Payment deferred:** implement everything up to **checkout ready / place order as `pending_payment`**. No Stripe charge, no live Capture. A stub “Pay later / mark paid (dev)” is enough until Mestryx unlocks payments.

```
1. CMS pages CRUD UI (one site) — finish admin so content is usable
2. Commerce schema (product, variant, category, cart, order, customer, tax, wishlist)
3. Admin product CRUD + inventory (one site)
4. Public PLP/PDP SSR + cart + wishlist
5. Checkout (address, shipping, tax calc) → create order pending_payment (NO Stripe yet)
6. Orders admin + emails stub + inventory reserve/decrement rules (on “mark paid” stub)
7. VAT lines + invoice PDF + accounting CSV (can run after stub paid)
8. Later: Stripe PaymentIntents + webhooks + refunds (F-711, F-708, F-508)
9. Coupons, returns, carriers — as needed
```

**Estimate (solo + agents):** shop-without-payment ~6–12 weeks after CMS pages UI; Stripe layer +2–4 weeks when unlocked.

---

## J. Explicitly out of “complete shop” v1

- Full marketplace (many sellers on one site)  
- Subscription boxes / complex recurring catalog  
- POS / in-store  
- Full accounting software (lettrage, immobilisations)  
- GraphQL  

---

## Status

Executable status: [feature-backlog.md](./feature-backlog.md) (FB-060+). Journeys: [13-journey-audit.md](./13-journey-audit.md). Do **not** maintain a parallel status table in this file.
