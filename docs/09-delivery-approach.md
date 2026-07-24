# Delivery approach — what to build when

**Status**: Accepted (revised)  
**Date**: 2026-07-16  
**Working name**: mestryx-platform

## Decision (short)

| Question | Answer |
|----------|--------|
| Install every optional tool up front? | **No** — add Storybook / Remotion / Stripe Capture when that track starts ([feature-backlog](./feature-backlog.md) § Sequencing) |
| Where do shared UI components live? | **`packages/ui` from the first real admin control** — not later “extract” |
| Public site rendering? | **TanStack Start SSR + SEO/AI from first public page** — no SPA-first ([11](./11-seo-ai-ready.md)) |
| Screen-specific layout/pages? | Stay in `apps/admin` / `apps/web` (compose shared primitives) |
| Full Figma before code? | **No** — light journeys + vertical slices |
| Mobile-first PWA first? | **No** — responsive admin; PWA later |
| Backend-only then UI? | **No** — slice API + minimal UI together |
| Rush staging / legal? | **No** — complete product first; staging + legal are late release gates |
| Agent CI / learning? | **Yes from start** — [10-agent-ops.md](./10-agent-ops.md) |

## Why create in `packages/ui` immediately (your point)

Putting Button/Input/Label in `apps/admin` then moving them later is a **guaranteed repasse**. On a greenfield monorepo we already have `packages/ui` — use it.

| Do from day 1 of admin | Still defer |
|------------------------|-------------|
| Primitives in `packages/ui` (Button, Input, Label, Card, Stack/Row) | Per-site theme engine (F-404) until needed |
| Tokens stub in `packages/tokens` (CSS variables) | Empty Storybook before primitives stabilize |
| Import `@mestryx/ui` from `apps/admin` | Fancy motion / marketing DS |
| Storybook once primitives exist (**FB-036**) | Pixel-perfect brand before DS |

**Rule**: if a component is reusable across ≥2 screens or apps → create it under `packages/ui` **first**.  
If it is a whole page or one-off form layout → `apps/admin/src/pages/...`.

---

## Repasse hotspots — eliminate by doing it right now

Places that usually force painful rewrites if done “quick and dirty”. **Do these correctly from the start.**

### 1. UI / front structure

| Hotspot | Wrong | Right from start |
|---------|-------|------------------|
| Shared controls | Build in `apps/admin`, extract later | **`packages/ui`** |
| Design tokens | Hardcoded hex in many files | **`packages/tokens`** CSS variables early |
| Types for API payloads | Duplicate interfaces in admin + api | **`packages/sdk`** or shared types generated/hand-kept once |
| i18n | Hardcoded FR strings in JSX | `t('key')` from first user-visible string (EN keys, FR/EN catalogs) |
| Routing/auth client | Ad-hoc fetch + localStorage JWT mess | Better Auth client patterns + cookie/session as designed |
| Public HTML | Vite SPA “SEO later” | **TanStack Start SSR** + SEO/AI checklist day one |

### 2. Multi-tenancy (highest risk)

| Hotspot | Wrong | Right from start |
|---------|-------|------------------|
| Queries | Forget `organization_id` | Every tenant table scoped; **cross-tenant tests** (F-104) before public |
| “Current org” | Global mutable hack | Explicit `organizationId` on request context / session |
| Site vs org | Mix site_id and org_id casually | Data dictionary: site belongs to org; enforce FKs |

### 3. API / contracts

| Hotspot | Wrong | Right from start |
|---------|-------|------------------|
| Dual APIs | One shape for “temp HTML”, another for “real SPA” | **One REST API**; admin is a client of that API |
| Errors | Random status/body | Consistent error JSON `{ code, message }` |
| IDs in URLs | Sequential ints for public resources | **UUID** (or slug where public-facing) per data-dictionary |
| OpenAPI | Add “later” | Document routes as you add them (orval/sdk when admin starts) |

### 4. Auth

| Hotspot | Wrong | Right from start |
|---------|-------|------------------|
| Sessions | DIY JWT in localStorage | **Better Auth** (Q12) with httpOnly cookies for admin |
| Roles | Check only in UI | **Server-side** CASL/RBAC on every mutation |
| Email verify | Skip for speed | Required before privileged actions (even in dogfood) |

### 5. Hosts / deploy

| Hotspot | Wrong | Right from start |
|---------|-------|------------------|
| CORS / cookies | `localhost` only assumptions | Config for `admin.mestryx.dev` + `api.mestryx.dev` from env |
| Host → site | String split in random handlers | Single **host resolution** module used by public app |
| Secrets | `.env` committed / scattered | `.env.example` + vault; never commit secrets |

### 6. Data model

| Hotspot | Wrong | Right from start |
|---------|-------|------------------|
| Slugs | Rename freely without uniqueness | Unique `(organization_id, slug)` / global host uniqueness for domains |
| Soft delete | Delete rows hard, regret later | Decide early: soft `archived` status on sites (already in dictionary) |
| Timestamps / timezone | Mix naive timestamps | `timestamptz` everywhere |

### 7. Optional tools (install when the track starts)

| Tool | When | Notes |
|------|------|-------|
| Storybook | Completeness track (**FB-036** done) | `pnpm --filter @mestryx/ui storybook` |
| Remotion | **FB-092 done** — app at `apps/remotion` | Scaffold + Studio/render + CI job `remotion` (MP4 artifacts for social/ads; store stays code UI) |
| Umami | After public traffic exists | F-802 |
| Stripe Capture | Explicit unlock (**FB-070**) | End-customer pay |
| PWA / Expo | After web dogfood | Extra surface |
| GraphQL | Never by default | REST first |

---

## Recommended sequence (revised)

```
1. Vertical product slices (admin + API + public SSR)
2. Design system depth + Storybook (FB-036) — done
3. Commerce completeness (media, shipping, email, accounts, …)
4. SaaS polish (invites, Customer Portal)
5. Remotion CI (FB-092) — **done** (`remotion` job + `remotion-promos` artifacts)
6. Staging + launch checklist (legal, backups) — late gates
```

## Critical journeys (MVP CMS)

1. Sign up → verify email → sign in  
2. Create organization → owner membership  
3. Create site → listed in admin  
4. Public home on `{slug}.sites.mestryx.dev` — **SSR HTML** with title/meta (or local Host header)  
5. Invite member (P1)  
6. Edit page → publish → public with SEO fields (CMS wave)

## Agent rules

1. **Shared UI → `packages/ui` first**, never “temp” in app then move.  
2. **One API** for admin and future web/mobile.  
3. **Tenant isolation tests** before any public site feature merges.  
4. **Public sites → SSR + SEO/AI** — never ship content-only SPA shell.  
5. Prefer one journey E2E over finishing all backend then all frontend.  
6. Follow [10-agent-ops.md](./10-agent-ops.md) for CI, debug, and learning loops.  
7. Do not invent components with no screen that uses them yet.
