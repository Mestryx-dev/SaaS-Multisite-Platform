# Wave G — Admin layout recipe homogenization

**Date:** 2026-07-28  
**Goal:** Same operating logic within each recipe family (R1–R8); verify and polish every admin page without forcing Products/Order detail into formAside.  
**SSOT:** [docs/design-system/admin-console-layout-recipes.md](../design-system/admin-console-layout-recipes.md)  
**Roadmap:** [admin-console-master-plan.md](../design-system/admin-console-master-plan.md) Wave G  

## Approach

1. Document recipes (G0) — **done**.
2. Polish R1 family to Shipping SoT bar (G1) — **done** (`2c43d9f`).
3. Mild i18n/eyebrow on other recipes (G2–G3) — **done**.
4. Human smoke + checklist ticks (G4) — ship + smoke.

No new page-shell React component unless G1 still drifts (YAGNI).

## G0 — Docs & Storybook

- [x] `admin-console-layout-recipes.md`
- [x] Master plan Wave G + CHANGELOG + README + component-directory + mvp notes + harmony AD-15
- [x] Storybook `Patterns/ConsoleLayout` → **Recipes matrix R1–R8**

## G1 — R1 polish — **done**

For each: Coupons, Categories, Menus, Banners, Media, Members

| Check | Action |
|-------|--------|
| Eyebrow | `t("nav.section.commerce\|content\|organization")` |
| Description | i18n key, remove hardcoded EN |
| EmptyState | title + description + CTA focus `#…-name` |
| Aside | single FormPanel; FormRow where 2+ fields |
| List rows | `shrink-0` actions; avoid wrap on delete |

**Commit:** `2c43d9f` — `fix(admin): align R1 pages with layout recipe polish`

## G2 — Mild polish (no archetype change) — **done**

Orders, Pages, Products, Dashboard, Reports, Billing, Modules — i18n description / eyebrow.  
Deferred: Order detail status copy, Sites mild i18n.

**Commit:** `fix(admin): i18n console PageHeader copy (Wave G2)`

## G3 — Returns — **done**

- [x] Commerce eyebrow
- [x] Keep abandoned FormPanel as secondary ops below list (R3 + ops, not R1)
- [x] EmptyState + abandoned ops hint

## G4 — Verify

- [x] Typecheck admin
- [x] Push `dev` + Admin-Dev redeploy
- [ ] Dev Admin smoke: Shipping + one R1 peer + Orders + Products
- [ ] Tick mvp §2.1 density when R1 family green; tick Shipping when human OK

## Out of scope

- Products/Pages → formAside
- Order detail → SplitLayout
- Auth redesign
- New wrapper component

## Rollback

Revert Wave G commits; recipes doc can stay as guidance.
