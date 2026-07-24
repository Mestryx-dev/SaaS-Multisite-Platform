# Dev smoke deploy — Dokploy (VM 245)

**Status**: Project provisioned · Git branch **`dev`** · Dokploy env **`Dev`** (not the default `production`).  
**Scope**: MVP smoke on hub **245**, not staging VM.  
**Repo**: [Mestryx-dev/SaaS-Multisite-Platform](https://github.com/Mestryx-dev/SaaS-Multisite-Platform)

**UI**: [Dev environment](https://dokploy.mestryx.dev/dashboard/project/-Vs-cpc8VxoBaVEiPYxV2/environment/3n9oonm3fmKyrN7S97g69)  
Leave default [`production`](https://dokploy.mestryx.dev/dashboard/project/-Vs-cpc8VxoBaVEiPYxV2/environment/g2f5M7qZn81XlH9KaO2Jv) empty until a real prod cutover.

## Dokploy IDs

| Resource | ID / name |
|----------|-----------|
| Project | `-Vs-cpc8VxoBaVEiPYxV2` · `mestryx-platform` |
| Environment **Dev** | `3n9oonm3fmKyrN7S97g69` ← smoke services live here |
| Environment `production` (default, empty) | `g2f5M7qZn81XlH9KaO2Jv` — do not use for MVP |
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

TLS / Traefik (Cloudflare tunnel → Dokploy 245):

- Cloudflare terminates HTTPS on the public edge.
- Tunnel origin to Traefik is **HTTP :80** (`entryPoints: web`).
- Dokploy domain: **`https: false`**, **`certificateType: none`**, port = app listen port (API `3001`). Same pattern as archery `dev-api-archery.mestryx.dev`.
- Do **not** enable Dokploy Let's Encrypt / `https: true` — conflicts with CF Always HTTPS → `ERR_TOO_MANY_REDIRECTS`.
- LAN check: `curl -H 'Host: dev-api-platform.mestryx.dev' http://192.168.0.245/health` (expect app JSON, not Traefik 502).
- SSOT: Memorizer [DNS/Traefik/CF](http://memorizer.lan/view/6d9ae84b-ad12-4bc1-bc3b-eebc5a2a4a88).

## Deploy order (smoke)

1. **DNS** — create the three CNAMEs/As to the same target as other `*.mestryx.dev` Dokploy apps.  
2. **Postgres** — Deploy (started at provision). Wait until status `done`.  
3. **API** — Deploy `API-Dev` (build `apps/api/Dockerfile`, branch `dev`).  
4. **Migrate** — one-shot against Dokploy Postgres (`pnpm --filter @mestryx/api db:migrate` with `DATABASE_URL` from Dokploy). Prefer a **temporary** Postgres external port (LAN only), then set `externalPort` back to null and reload.  
5. **Seed Luna** — `pnpm --filter @mestryx/api db:seed` with `SEED_EMAIL` / `SEED_PASSWORD` from vault (defaults are local-only). Capture printed `WEB_DEV_SITE_ID=<uuid>`.  
6. **Bind smoke host** — set the same `WEB_DEV_SITE_ID` on **Web-Dev** and **API-Dev** env, then redeploy both. Required because `dev-web-platform.mestryx.dev` is not a `*.sites.dev.mestryx.dev` subdomain; without it the storefront falls back to `id=local` and `/wishlist` / `/cart` / `/checkout` 404. API uses the id for `/v1/public/resolve-host` on `WEB_ORIGIN` / localhost.  
7. **Admin** — Deploy `Admin-Dev` (`apps/admin/Dockerfile` + `VITE_*` build args).  
8. **Web** — Deploy `Web-Dev` (`apps/web/Dockerfile`) if not already redeployed in step 6.  

## Smoke checklist

1. [ ] `GET https://dev-api-platform.mestryx.dev/health` → 200  
2. [ ] `GET …/v1/public/resolve-host?host=dev-web-platform.mestryx.dev` → 200 + Luna site (not 500)  
3. [ ] `https://dev-admin-platform.mestryx.dev` → SPA loads  
4. [ ] Sign-in with seed user (or create org)  
5. [ ] `https://dev-web-platform.mestryx.dev` → HTML titled Luna (not “Demo Store”)  
6. [ ] `https://dev-web-platform.mestryx.dev/wishlist` → Soft page 200 (empty OK)  
7. [ ] Admin Sites + Products list OK for Luna Bijoux  

## Rollback

- Redeploy previous Dokploy deployment per app.  
- Postgres: volume `mestryx-platform-pg-dev-vk1j3y-data` — restore from backup destination if configured.  
- Do **not** delete the project without Mestryx OK.

## Out of scope (later)

- Dedicated staging VM  
- Redis service (optional; API tolerates missing `REDIS_URL`)  
- Wildcard `*.sites.dev.mestryx.dev`  
- Production env on this project  
