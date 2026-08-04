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

## Example public hosts (upstream dogfood)

Replace with your own domains when forking.

| Host pattern | Service |
|--------------|---------|
| `demo-api-platform.example.com` | API |
| `demo-admin-platform.example.com` | Admin |
| `demo-web-platform.example.com` | Web SSR |
| `demo-storybook-platform.example.com` | Storybook |
| Apex marketing host | Marketing |

Upstream Mestryx dogfood currently uses `*.mestryx.dev` (see product docs). Forks should not rely on those hosts.

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
7. **Admin / Web / Storybook / Marketing** — deploy with build args as needed.

## Smoke checklist

1. [ ] `GET https://<api-host>/health` → 200  
2. [ ] `GET …/v1/public/resolve-host?host=<web-host>` → 200 + expected site  
3. [ ] Admin SPA loads; sign-in with seed user  
4. [ ] Storefront HTML loads for the seed shop  
5. [ ] Optional: Storybook / Marketing 200  

## Rollback

- Redeploy the previous image per app.  
- Restore Postgres from your backup destination if configured.  
- Do **not** delete the orchestrator project without an explicit operator decision.

## Out of scope

- Production cutover checklist (separate)  
- Redis (optional; API tolerates missing `REDIS_URL`)  
- Auth gate on public Storybook  
