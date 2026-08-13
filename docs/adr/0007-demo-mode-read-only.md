# ADR-0007: Demo environment read-only + auto session

**Status**: Accepted  
**Date**: 2026-08-04  

## Context

Public demos (`demo-admin-platform.mestryx.dev`) need a fully seeded Luna catalog without requiring visitors to know seed credentials, and without letting mutations pollute the shared demo database.

## Decision Drivers

1. Skip login for demo visitors while still using Better Auth sessions.
2. Keep seed data intact — writes must not persist.
3. Isolate demo flags to demo hosts only (never merchant prod).
4. Prefer API enforcement over a full client-side localStorage CRUD overlay (YAGNI for v1).

## Considered Options

1. Shared login credentials on the landing page — rejected (leak + write risk).
2. Client-only mock store — rejected for v1 (duplicates every admin mutation path).
3. **DEMO_MODE**: auto seed session + block `/v1` mutations — chosen.

## Decision Outcome

- API `DEMO_MODE=true` enables:
  - `POST /v1/demo/enter` → sync credential hash to `SEED_PASSWORD`, then Better Auth email sign-in as `SEED_EMAIL` / `SEED_PASSWORD` (self-heals when DB was seeded with a different password)
  - Middleware: mutating `/v1/*` → `403 DEMO_READ_ONLY` (GET allowed)
  - Sign-up via `/api/auth/*` blocked
- Admin `VITE_DEMO_MODE=true`: auto-calls demo-enter, Shell banner, friendly toast on `DEMO_READ_ONLY`
- localStorage remains for UI prefs only (theme, sidebar)
- Storefront Soft boutique / Luna presets unchanged

## Consequences

- Dokploy demo API/Admin must set env flags + keep DB seeded
- Rollback: unset `DEMO_MODE` / `VITE_DEMO_MODE`
