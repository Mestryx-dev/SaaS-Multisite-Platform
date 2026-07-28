# Wave G — Admin layout recipe homogenization

**Date:** 2026-07-28  
**Goal:** Same operating logic within each recipe family (R1–R8); verify and polish every admin page without forcing Products/Order detail into formAside.  
**SSOT:** [docs/design-system/admin-console-layout-recipes.md](../design-system/admin-console-layout-recipes.md)  
**Roadmap:** [admin-console-master-plan.md](../design-system/admin-console-master-plan.md) Wave G  

## Approach

1. Document recipes (G0) — **done** in this pass.
2. Polish R1 family to Shipping SoT bar (G1).
3. Mild i18n/eyebrow on other recipes (G2–G3).
4. Human smoke + checklist ticks (G4).

No new page-shell React component unless G1 still drifts (YAGNI).

## G0 — Docs & Storybook (this commit)

- [x] `admin-console-layout-recipes.md`
- [x] Master plan Wave G + CHANGELOG + README + component-directory + mvp notes + harmony AD-15
- [x] Storybook `Patterns/ConsoleLayout` → **Recipes matrix R1–R8**

## G1 — R1 polish (one commit per page or batched by pair)

For each: Coupons, Categories, Menus, Banners, Media, Members

| Check | Action |
|-------|--------|
| Eyebrow | `t("nav.section.commerce\|content\|organization")` |
| Description | i18n key, remove hardcoded EN |
| EmptyState | title + description + CTA focus `#…-name` |
| Aside | single FormPanel; FormRow where 2+ fields |
| List rows | `shrink-0` actions; avoid wrap on delete |

**Estimate:** 1–2 cycles. Commit: `fix(admin): align <Page> with R1 layout recipe`

## G2 — Mild polish (no archetype change)

Orders, Pages, Products, Order detail, Dashboard, Reports, Billing, Modules, Sites — i18n description / eyebrow only.

**Estimate:** 1 cycle. Prefer one commit: `fix(admin): i18n console PageHeader copy (Wave G2)`

## G3 — Returns

- Commerce eyebrow
- Keep abandoned FormPanel as secondary ops below list (document as R3 + ops, not R1)
- EmptyState if missing

## G4 — Verify

- Typecheck admin + Storybook build optional
- Dev Admin smoke: Shipping + one R1 peer + Orders + Products
- Tick mvp §2.1 density when R1 family green; tick Shipping when human OK

## Out of scope

- Products/Pages → formAside
- Order detail → SplitLayout
- Auth redesign
- New wrapper component

## Rollback

Revert Wave G commits; recipes doc can stay as guidance.
