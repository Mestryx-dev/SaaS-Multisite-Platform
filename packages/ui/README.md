# packages/ui

Shared design system for `apps/admin` and `apps/web` (React SSR).

- Themes: `data-theme="platform"` | `data-theme="storefront"` via `@mestryx/tokens`
- Storybook: `pnpm --filter @mestryx/ui storybook` (http://localhost:6006)
- If the Storybook canvas goes blank/white after a long session, restart Storybook (Tailwind utilities HMR); see `docs/design-system/stack-and-tooling.md`

Create reusable controls **here first** — see `docs/09-delivery-approach.md`.
