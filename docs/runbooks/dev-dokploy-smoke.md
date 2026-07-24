# Dev smoke deploy — Dokploy (VM 245)

**Status**: Project provisioned · Git branch **`dev`** · Dokploy UI env currently labeled `production` (default) — **rename to `dev` in UI** when convenient.  
**Scope**: MVP smoke on hub **245**, not staging VM.  
**Repo**: [Mestryx-dev/SaaS-Multisite-Platform](https://github.com/Mestryx-dev/SaaS-Multisite-Platform)

## Dokploy IDs

| Resource | ID / name |
|----------|-----------|
| Project | `-Vs-cpc8VxoBaVEiPYxV2` · `mestryx-platform` |
| Environment | `g2f5M7qZn81XlH9KaO2Jv` (default — treat as **dev**) |
| Postgres | `jKgdinMzPNkenLxpLdKni` · `Postgres-Dev` · app `mestryx-platform-pg-dev-vk1j3y` |
| API | `kCBbgI5zhsOzOT6_ODHfI` · `API-Dev` |
| Admin | `gdyLubG94HJxre7WrKkCg` · `Admin-Dev` |
| Web | `5Hbp0nfyZn9Nkh9eb8hVe` · `Web-Dev` |

Secrets (DB password, `BETTER_AUTH_SECRET`) live **only in Dokploy env** — not in git.

## Hosts (need Cloudflare DNS → Dokploy / tunnel)

| Host | Service | Port |
|------|---------|------|
| `dev-api-platform.mestryx.dev` | API | 3001 |
| `dev-admin-platform.mestryx.dev` | Admin | 80 |
| `dev-web-platform.mestryx.dev` | Web SSR | 3000 |

TLS: Let's Encrypt on each domain (same pattern as archery `dev-*-archery.mestryx.dev`).

## Deploy order (smoke)

1. **DNS** — create the three CNAMEs/As to the same target as other `*.mestryx.dev` Dokploy apps.  
2. **Postgres** — Deploy (started at provision). Wait until status `done`.  
3. **API** — Deploy `API-Dev` (build `apps/api/Dockerfile`, branch `dev`).  
4. **Migrate** — one-shot against Dokploy Postgres (`pnpm --filter @mestryx/api db:migrate` with `DATABASE_URL` from Dokploy, or exec into API container after first start).  
5. **Seed (optional)** — `pnpm db:seed` with `SEED_EMAIL` / `SEED_PASSWORD` from your vault; set `WEB_DEV_SITE_ID` on Web if testing without platform subdomain.  
6. **Admin** — Deploy `Admin-Dev` (`apps/admin/Dockerfile` + `VITE_*` build args).  
7. **Web** — Deploy `Web-Dev` (`apps/web/Dockerfile`).  

## Smoke checklist

1. [ ] `GET https://dev-api-platform.mestryx.dev/health` → 200  
2. [ ] `https://dev-admin-platform.mestryx.dev` → SPA loads  
3. [ ] Sign-in / create org (or seed user)  
4. [ ] `https://dev-web-platform.mestryx.dev` → HTML (with `WEB_DEV_SITE_ID` or site host)  
5. [ ] Admin Sites + Products list OK  

## Rollback

- Redeploy previous Dokploy deployment per app.  
- Postgres: volume `mestryx-platform-pg-dev-vk1j3y-data` — restore from backup destination if configured.  
- Do **not** delete the project without Mestryx OK.

## Out of scope (later)

- Dedicated staging VM  
- Redis service (optional; API tolerates missing `REDIS_URL`)  
- Wildcard `*.sites.dev.mestryx.dev`  
- Production env on this project  
