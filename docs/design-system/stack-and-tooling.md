# Stack and tooling (design system)

**Last updated:** 2026-07-20  
**SSOT versions:** [05-stack-versions.md](../05-stack-versions.md)  
**Status:** **Installed** in `packages/ui` (Tailwind 4.3.2, motion 12.x, `components.json`, tw-animate-css). Legacy `.ui-*` classes remain during migrate; shadcn primitives added incrementally.

---

## Locked versions

| Role | Package | Band | Notes |
|------|---------|------|-------|
| CSS | `tailwindcss` + `@tailwindcss/vite` / `@tailwindcss/cli` | **4.3.2** | Vite for admin + Storybook; CLI → `dist/styles.css` for SSR |
| Components | shadcn CLI (`components.json` in `packages/ui`) | **4.x** | Generate into this package only |
| Motion | `motion` | **12.x** | `patterns/motion/` |
| Animate | `tw-animate-css` | current | TW4 recipe |
| Docs UI | Storybook `@storybook/react-vite` | **10.x** | Theme toolbar + `preview.css` canvas baseline; **Autodocs** on `Components/*` only (`tags: ["autodocs"]`); interaction `play` via `storybook/test` on high-traffic atoms |

---

## Monorepo layout

```text
packages/ui/
  components.json
  src/
    styles.css              # Tailwind entry + @theme inline (+ @source .storybook)
    styles.components.css   # legacy .ui-* (SSR fallback)
    lib/utils.ts            # cn()
    components/             # atoms
    patterns/               # organisms + motion
    foundations/            # token stories
  .storybook/
    preview.tsx / preview.css  # theme decorator + non-Tailwind canvas fallback
    theme.ts                   # platformGlobals / storefrontGlobals for pattern locks
apps/admin/                 # @tailwindcss/vite
apps/web/                   # prefers packages/ui/dist/styles.css
```

---

## Dual theme

Tokens from `@mestryx/tokens` (`data-theme="platform"|"storefront"`).

| Surface | Storybook behavior |
|---------|-------------------|
| Atoms (`Components/*`) | Autodocs + toolbar theme (default **Vitrine** / storefront) |
| Foundations | Toolbar switch; no autodocs |
| Patterns/AppShell | Locked to **platform** via `globals`; no autodocs |
| Patterns/Store* / Vitrine | Locked to **storefront** via `globals`; no autodocs |
| Foundations/Themes | Side-by-side panels (in-page `data-theme`, independent of toolbar) |

Helpers: `.storybook/theme.ts` (`platformGlobals` / `storefrontGlobals`).

### Storybook blank canvas

If the preview iframe is empty/white while Controls still work, Tailwind utilities likely dropped after a long HMR session. Restart Storybook (`pnpm --filter @mestryx/ui storybook`). `preview.css` keeps background/form chrome visible even when utilities are missing.

---

## Agent design stack

Orchestration: skill **`saas-frontend-impeccable`** (new projects) + **`mestryx-design-system`** (this repo).

| Layer | Tool | Role |
|-------|------|------|
| Quality / CI | Impeccable | `/impeccable *`, `pnpm ds:detect` |
| Anti-slop craft | Taste v2 (`design-taste-frontend`) | Dials VARIANCE / MOTION / DENSITY |
| Style intelligence | UI UX Pro Max | Palettes, fonts, landing patterns |
| HTML spikes / review | Huashu Design | Prototypes, decks, 5-dim critique — not product React |
| Proof | Playwright | Storybook dual-theme smoke + admin e2e |

**Conflict rule:** `PRODUCT.md` / `DESIGN.md` / `@mestryx/tokens` win for product code.

Optional agent browser: [Playwright MCP](https://playwright.dev/) via `npx @playwright/mcp@latest` (not required in CI).

---

## Commands

```bash
pnpm --filter @mestryx/ui storybook
pnpm --filter @mestryx/ui build:css
pnpm ds:detect
# Storybook on :6006, then:
RUN_STORYBOOK_E2E=1 pnpm --filter @mestryx/ui storybook:smoke
```

---

## Related

- Hub: [README.md](./README.md)
- Motion: [motion-guidelines.md](./motion-guidelines.md)
- Directory: [component-directory.md](./component-directory.md)
- Process: [process-and-boundaries.md](./process-and-boundaries.md)
