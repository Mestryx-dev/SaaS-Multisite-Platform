# Design system — Mestryx Multisite Platform

**Last updated:** 2026-07-28  
**Status:** FB-037 **done** + visual correction; admin console Waves A–F landed; **Wave G** layout recipes SSOT opened.

This folder is the **working reference** for the Mestryx design system. Agents read here before inventing UI process or stack choices. Orchestration skill: **`mestryx-design-system`**.

---

## Navigation (Diátaxis-style)

| Type | Document | When to read |
|------|----------|--------------|
| **Context** | [`PRODUCT.md`](../../PRODUCT.md) | Audience, surfaces, anti-references |
| **Context** | [`DESIGN.md`](../../DESIGN.md) | Visual tokens (both themes) |
| **Explanation** | [process-and-boundaries.md](./process-and-boundaries.md) | Taxonomy, package boundaries, agent checklist |
| **Reference** | [stack-and-tooling.md](./stack-and-tooling.md) | Locked versions: Tailwind 4.3, shadcn 4, motion 12, Storybook 10 |
| **Reference** | [motion-guidelines.md](./motion-guidelines.md) | In-app motion with `motion`; Remotion = marketing only |
| **Reference** | [shadcn-css-variables.md](./shadcn-css-variables.md) | Runtime CSS var lexicon (shadcn names + Mestryx extensions) |
| **How-to** | [site-theming.md](./site-theming.md) | N-site presets + themeJson v2 (Shopify-like) |
| **Catalog** | [component-directory.md](./component-directory.md) | Atomic layers + platform vs storefront inventory |
| **Checklist** | [ux-ui-harmony-checklist.md](./ux-ui-harmony-checklist.md) | Brand/UX wave: verify · correct · polish · manage (pages + Studio harvest) |
| **Reference** | [i18n.md](./i18n.md) | Locale catalogs, key naming, UI props-only rule, parity CI |
| **Roadmap** | [admin-console-master-plan.md](./admin-console-master-plan.md) | Admin Waves A–G: density → table UX → … → F-01 → **layout recipes** |
| **Recipes** | [admin-console-layout-recipes.md](./admin-console-layout-recipes.md) | R1–R8 operating logic; page matrix; Wave G polish |
| **Log** | [CHANGELOG.md](./CHANGELOG.md) | Traceability bullets per milestone |
| **Reference** | [`packages/tokens`](../../packages/tokens) | Dual-theme CSS variables (`platform` / `storefront`) |
| **Reference** | [`packages/ui`](../../packages/ui) | Primitives + Storybook |
| **Backlog** | [feature-backlog.md](../feature-backlog.md) | **FB-037** DS depth |

---

## Agent tooling

| Tool | Role |
|------|------|
| Skill `mestryx-design-system` | Route UI work; DoD for UI PRs |
| Skill `saas-frontend-impeccable` | New-project playbook (Taste + Pro Max + Huashu + Impeccable) |
| Impeccable (project install) | `/impeccable` commands + `npx impeccable detect` anti-slop |
| Taste / UI UX Pro Max / Huashu | Craft + intelligence + HTML spikes (see [stack-and-tooling.md](./stack-and-tooling.md#agent-design-stack)) |
| Playwright | `RUN_STORYBOOK_E2E=1 pnpm --filter @mestryx/ui storybook:smoke` |
| Skill `design-md` | Lint/export `DESIGN.md` |
| `pnpm ds:detect` | CI-friendly detect over UI + apps |

Tracked install: `.github/skills/impeccable`, `.claude/skills/impeccable`. Local Cursor skills under `.cursor/` (gitignored) — reload harness after install/update.

Baseline detect report: [reports/detect-baseline-2026-07-19.json](./reports/detect-baseline-2026-07-19.json).

---

## Stack lock (SSOT)

Pinned in [05-stack-versions.md](../05-stack-versions.md).

| Layer | Choice | Version band |
|-------|--------|----------------|
| CSS | **Tailwind CSS** + `@tailwindcss/vite` | **4.3.x** |
| Components | **shadcn/ui** CLI → `packages/ui` | CLI **4.x** |
| Motion | **`motion`** | **12.x** |
| Tokens | `@mestryx/tokens` | dual theme |
| Themes | **platform** · **storefront** | both required |
| Storybook | **10.x** | theme toolbar |

**Out of DS scope:** Remotion (FB-092).

---

## UI Definition of Done

1. Story under `Foundations/` / `Components/` / `Patterns/`
2. Both themes smoke-checked
3. `pnpm ds:detect` clean on touched paths (or documented waiver)
4. Directory row + CHANGELOG updated

---

## Phasing

| Phase | Scope | Status |
|-------|--------|--------|
| Hub docs | Stack lock, directories, motion, process | done |
| 0 | Agent tooling (Impeccable + orchestration skill) | done |
| 1 | PRODUCT.md + DESIGN.md + token sync | done |
| 2 | Tailwind + shadcn config + motion install | done |
| 3–4 | Components + Storybook catalog | done |
| 5 | Detect CI gates | done |
| 6 | App consumers on `@mestryx/ui` | done |

---

## Related

- Progress: [PROGRESS.md](../../PROGRESS.md)
- Agent ops: [10-agent-ops.md](../10-agent-ops.md)
