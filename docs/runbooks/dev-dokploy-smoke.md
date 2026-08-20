# Dev smoke deploy — Dokploy (generic)

**Status:** Pattern for a self-hosted Dokploy **Dev** environment (not production).  
**Repo:** [Mestryx-dev/SaaS-Multisite-Platform](https://github.com/Mestryx-dev/SaaS-Multisite-Platform)

Private orchestrator IDs, LAN addresses, and internal wiki links are **not** stored in this repository. Keep them in your operator knowledge base / secret store.

## Suggested services

| Service | Dockerfile | Notes |
|---------|------------|--------|
| Postgres | Dokploy managed or compose | App DB for API |
| API | `apps/api/Dockerfile` | Branch `dev` typical for smoke |
| Admin | `apps/admin/Dockerfile` | Pass `VITE_*` build args |
| Web | `apps/web/Dockerfile` | SSR storefront |
| Storybook (optional) | `packages/ui/Dockerfile` | Static DS catalog |
| Marketing (optional) | `apps/marketing/Dockerfile` | Product landing; `PUBLIC_*` build-args |

Secrets (DB password, `BETTER_AUTH_SECRET`, Stripe test keys, Umami website IDs) live **only** in the orchestrator env — not in git.

## Example public hosts (upstream Mestryx demos)

Replace with your own domains when forking.

| Host pattern | Service |
|--------------|---------|
| `demo-api-platform.example.com` | API |
| `demo-admin-platform.example.com` | Admin |
| `demo-web-platform.example.com` | Web SSR |
| `demo-storybook-platform.example.com` | Storybook |
| Apex marketing host | Marketing |

Upstream Mestryx demo hosts currently uses `*.mestryx.dev` (see product docs). Forks should not rely on those hosts.

## TLS / reverse proxy tips

- If a CDN terminates HTTPS and tunnels HTTP to Traefik, set the app domain **HTTPS off** / no ACME on the orchestrator to avoid redirect loops.
- Health check against the **internal** listen port of the container (e.g. API `3001`), not only the public edge.

## Deploy order (smoke)

1. **DNS** — point demo hosts at your Dokploy / tunnel target.  
2. **Postgres** — deploy; wait until healthy.  
3. **API** — build & deploy; set `DATABASE_URL`, `BETTER_AUTH_SECRET`, origins.  
4. **Migrate** — `pnpm --filter @mestryx/api db:migrate` with that `DATABASE_URL`.  
5. **Seed (optional)** — `pnpm --filter @mestryx/api db:seed` with `SEED_EMAIL` / `SEED_PASSWORD` from your vault (**required** env; no default password in source). Capture printed `WEB_DEV_SITE_ID`.  
6. **Bind smoke storefront** — set the same `WEB_DEV_SITE_ID` on Web + API if the demo host is not under `*.sites.…`.  
   Host aliases such as `demo-web-…` must appear in API `TRUSTED_ORIGINS` (and/or comma-separated `PUBLIC_WEB_HOST`) so `/v1/public/resolve-host` returns the seeded site (e.g. Luna Bijoux), not a stub.
7. **Admin / Web / Storybook / Marketing** — deploy with build args as needed.

### Public demo mode (ADR-0007)

For isolated **demo** API + Admin hosts only (never merchant prod):

| Service | Env / build arg | Effect |
|---------|-----------------|--------|
| API | `DEMO_MODE=true` | Block mutating `/v1/*` (`403 DEMO_READ_ONLY`); enable `POST /v1/demo/enter`; block sign-up |
| API | `SEED_EMAIL` / `SEED_PASSWORD` | Credentials used by demo-enter (same as seed) |
| Admin | `VITE_DEMO_MODE=true` (Docker build arg) | Auto demo-enter, Shell banner, hide sign-up |

Ensure the demo DB is seeded before enabling. UI prefs (theme/sidebar) may still use localStorage; catalog writes do not persist.

## Smoke checklist

1. [ ] `GET https://<api-host>/health` → 200  
2. [ ] `GET …/v1/public/resolve-host?host=<web-host>` → 200 + expected site  
3. [ ] Admin SPA loads; sign-in with seed user **or** (demo mode) skip login via demo-enter + banner  
4. [ ] Demo mode: mutation → toast / `403 DEMO_READ_ONLY`  
5. [ ] Storefront HTML loads for the seed shop  
6. [ ] Optional: Storybook / Marketing 200; marketing primary CTA = store demo  

## Rollback

- Redeploy the previous image per app.  
- Restore Postgres from your backup destination if configured.  
- Do **not** delete the orchestrator project without an explicit operator decision.

## Out of scope

- Production cutover checklist (separate)  
- Redis (optional; API tolerates missing `REDIS_URL`)  
- Auth gate on public Storybook  
