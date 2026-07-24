# Design system process and boundaries

**Last updated:** 2026-07-19  
**Stack SSOT:** [05-stack-versions.md](../05-stack-versions.md) · [stack-and-tooling.md](./stack-and-tooling.md)

How Mestryx organizes and governs UI. This doc is **project-owned** — practices may have been learned elsewhere; product docs never brand another repo as the source of truth.

---

## Practices (locked)

| Practice | Why |
|----------|-----|
| Storybook as living catalog | One place for agents and humans to discover UI |
| Sidebar taxonomy | Titles `Foundations` / `Components` / `Patterns` (Atomic layers as labels, not dogma) |
| Package boundaries | Primitives in `packages/ui`; apps compose; no circular imports |
| Dual-surface catalogs | **Platform** (admin) vs **storefront** (shop) sharing themed atoms |
| Docs beside code | Colocated `*.stories.tsx`; hub under `docs/design-system/` |
| Explicit non-goals | One-off page CSS and legacy dumps stay out of the shared package |

---

## Boundaries (do not)

| Anti-pattern | Instead |
|--------------|---------|
| Second shadcn/Tailwind tree inside an app | Generate into `packages/ui` only |
| Single-theme Storybook | Expose **platform** and **storefront** via toolbar |
| Forked component trees “for animation” | Wrap atoms with `patterns/motion/` ([motion-guidelines.md](./motion-guidelines.md)) |
| Inventing UI versions in chat | Pin from [05-stack-versions.md](../05-stack-versions.md) |
| Naming foreign projects in product docs | Absorb ideas; document as Mestryx process |

---

## Stack target (already REC)

Baseline FB-033/036 (custom CSS + gallery) is the **starting point**. Destination is already REC in stack-versions:

- Tailwind **4.3.x**
- shadcn CLI **4.x** → `packages/ui`
- **`motion` 12.x**

Migration and depth = **FB-037**. Write an ADR only if **leaving** that REC (e.g. Next.js for public).

---

## Layout mapping

| Concern | Home |
|---------|------|
| Design tokens | `packages/tokens` + Tailwind `@theme inline` bridge |
| Atoms | `packages/ui/src/components/` |
| Molecules / organisms | `packages/ui/src/patterns/` tagged `platform` \| `storefront` \| `shared` |
| Storybook | `packages/ui/.storybook` (optional later config-only app) |
| Theme switch | Toolbar → `data-theme="platform"|"storefront"` |
| Motion helpers | `packages/ui/src/patterns/motion/` |

Inventory: [component-directory.md](./component-directory.md).

---

## Agent checklist (before adding UI)

1. Read [stack-and-tooling.md](./stack-and-tooling.md).
2. Check [component-directory.md](./component-directory.md) — exists under platform/storefront/shared?
3. Prefer extending `packages/ui` over one-off CSS in apps.
4. Add or update a Storybook story in the correct title group.
5. If motion is needed, follow [motion-guidelines.md](./motion-guidelines.md).

---

## Related

- Hub: [README.md](./README.md)
- Backlog: [feature-backlog.md](../feature-backlog.md) · FB-037
