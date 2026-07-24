# Motion guidelines (in-app UI)

**Last updated:** 2026-07-20  
**Dependency:** package **`motion`** ^12 (ex-Framer Motion) — [05-stack-versions.md](../05-stack-versions.md)  
**Not in scope:** Remotion (FB-092) — marketing / CI video only, not design-system primitives.

---

## Principles

1. **Intent-driven** — motion explains state change (enter/exit, layout shift, success/error feedback). No decorative loops or parallax noise.
2. **Wrap, don’t fork** — build `Motion*` helpers and `patterns/motion/` around shadcn / `@mestryx/ui` atoms. Do not maintain a parallel forked button/dialog tree “just for animation.”
3. **Authentic & professional** — short durations, ease curves that feel product-grade (subtle press, dialog presence, list reorder). Prefer restraint over spectacle.
4. **Accessibility** — always respect `prefers-reduced-motion` (disable or replace with instant opacity/display changes).
5. **SSR-safe for web** — public storefront stays careful: animate in client islands; avoid motion that breaks hydration or fights SSR markup.

---

## Preferred use cases

| Intent | Example surfaces |
|--------|------------------|
| Presence | Dialog / sheet / drawer open-close |
| Feedback | Button press, toast appear, form field error shake (subtle) |
| Layout | List reorder, accordion expand, tab panel crossfade |
| Commerce | Add-to-cart confirmation (Flash), cart drawer open/close |
| Navigation | Page or view transitions (admin SPA; storefront only where SSR-safe) |

### Storefront Soft boutique (SSR + island)

| Intent | Implementation |
|--------|----------------|
| Cart drawer open/close | `CartDrawer` + `store-chrome.js`: class `is-open` + CSS translate/opacity (~220ms); `[hidden]` after close; Escape / overlay click |
| Mobile nav (burger) | Checkbox + label progressive enhancement (works sans JS); Escape unchecks via island; Cart always visible |
| Soft glass chrome | Tokens `--glass-*` on header, PLP toolbar, drawer — not product media |
| Header scroll dock | Sticky solid `--background` bar; JS `is-scrolled` shrinks to floating pill (same paint; no ambient/blur on chrome) |
| Gallery thumb swap | Same island: `[data-mx-gallery-thumb]` → `#mx-gallery-main` `src` |
| Card hover | CSS transform ~200ms on product/collection cards (no glass fill on images) |
| ATC feedback | SSR redirect + `Flash` (no `motion` package on public web) |

Respect `prefers-reduced-motion`: drawer opens/closes instantly (skip transition, toggle `hidden` immediately).  
Respect `prefers-reduced-transparency`: solid `--card` backgrounds, no backdrop blur.

---

## Avoid

- Endless infinite loops on marketing chrome inside the app shell
- Parallax / scroll-jacking that hurts readability or SEO focus
- Motion that requires large client bundles on every public page without need
- Using Remotion components inside admin/store UI packages
- New dependency named `framer-motion` when `motion` is the REC package

---

## Implementation sketch (phase 2+)

```text
packages/ui/src/patterns/motion/
  motion-presence.tsx      # AnimatePresence helpers for dialogs/sheets
  motion-press.tsx         # optional press feedback wrapper
  reduced-motion.ts        # hook / util reading prefers-reduced-motion
```

Pattern:

- Import primitives from `components/`.
- Compose motion at the **pattern** layer (or a thin `MotionButton` wrapper that still uses the same atom styles).
- Storybook: document reduced-motion behavior in Foundations or Patterns stories.

---

## Remotion boundary

| Tool | Role |
|------|------|
| `motion` | In-app UI DS |
| Remotion | Landing / promo video renders (FB-092), CI only |

Do not share Remotion compositions as Storybook “components” for product UI.

---

## Related

- Stack: [stack-and-tooling.md](./stack-and-tooling.md)
- Directory: [component-directory.md](./component-directory.md)
- Hub: [README.md](./README.md)
