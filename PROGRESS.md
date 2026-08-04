# Project progress

Validate milestones with Mestryx before checking.  
**Status SSOT:** [docs/feature-backlog.md](docs/feature-backlog.md). This file = thin gates only. Sync: [docs/10-agent-ops.md](docs/10-agent-ops.md) §2.2.

## Spec preparation

- [x] App spec, stack, brand brief (keys), data dictionary, AGENTS, catalog + backlog, integrations, error journal
- [x] Open questions Q1–Q16 locked (`docs/08`)
- [x] ADR-0001 stack direction Accepted
- [x] Brand brief **visuals** validated — [mvp-confirmation-checklist.md](docs/mvp-confirmation-checklist.md) F-01 · 2026-07-25 · [ux-ui-harmony-checklist.md](docs/design-system/ux-ui-harmony-checklist.md)

## Implementation milestones

- [x] Phase 1 skeleton (monorepo + API + Docker + CI) — 2026-07-16
- [x] Waves A–G foundations (identity, admin, public SSR, domains, billing stub, Docker/staging runbook)
- [x] Commerce Option B through `pending_payment` (FB-060+) — see backlog Phase 6
- [x] Design system FB-036 / FB-037 (tokens, Storybook, apps on `@mestryx/ui`) — DS chronology: `docs/design-system/CHANGELOG.md`
- [x] Remotion scaffold + CI (FB-092)
- [x] Journey map (`docs/13-journey-audit.md`) — routes only; status in backlog
- [x] Docs ownership matrix (`docs/README.md`) — one status SSOT
- [x] Journey + platform gaps promoted to FB-075+ (Phase 6/8 + icebox) — 2026-07-19
- [x] Wave A merch + trust (FB-073/074/076/077/098) — banners, search, consent, legal CMS, CSP — 2026-07-19
- [x] Wave B CMS depth (FB-075/086/088) — blocks, media library, menus — 2026-07-19
- [x] Wave C shop UX (FB-078/079/080/083) — address book, tracking, PLP filters, wishlist polish — 2026-07-19
- [x] Wave D platform brand/ops (FB-084/085/089/097) — modules, theme, Umami hook, entitlements UX — 2026-07-19
- [x] Wave E CMS preview + deferred commerce MVP (FB-087/081/082) — preview token, abandoned cart emails, RMA — 2026-07-19
- [x] Store polish + payment seams (FB-102 Soft boutique, FB-103 ADR-0004 + schema, FB-104 tracking/RMA) — 2026-07-24
- [x] Dev Dokploy smoke Luna bind (`WEB_DEV_SITE_ID`, resolve-host smoke host, seed email verified) — 2026-07-24 · [dev-dokploy-smoke.md](docs/runbooks/dev-dokploy-smoke.md)
- [x] Admin console fluid width (PageContent full, SplitLayout `listDetail`, FormPanel xl) — 2026-07-24 · DS CHANGELOG

## Next priority (visual)

- [x] UX / UI harmony wave (Storybook dual-theme audit) — foundations, atoms, patterns, gaps, admin/storefront compose — [ux-ui-harmony-checklist.md](docs/design-system/ux-ui-harmony-checklist.md)
- [x] Storefront Soft boutique + commerce patterns (gallery, trust, cart drawer island, editable cart, checkout 2-col) — 2026-07-20
- [x] Storefront Soft glass chrome + drawer CSS motion (Apple-subtil; admin untouched) — 2026-07-20
- [x] Brand brief **visuals** human sign-off (F-01) — 2026-07-25 · [mvp-confirmation-checklist.md](docs/mvp-confirmation-checklist.md)

## Release gates (deferred)

- [ ] Staging deploy (FB-044)
- [ ] Launch checklist (FB-045)
- [ ] Unlock end-customer Stripe when ready (FB-070)
