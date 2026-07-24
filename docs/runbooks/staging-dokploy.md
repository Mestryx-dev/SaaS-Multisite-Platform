# Staging deploy — Dokploy (Mestryx)

**Status**: Agent prep done · **blocked on Mestryx OK** for DNS + Dokploy + secrets + deploy  
**Hosts (Q9)**: `admin.staging.mestryx.dev` · `api.staging.mestryx.dev` · `*.sites.staging.mestryx.dev`

## Human checklist (required)

1. Create DNS records for Q9 hosts → Dokploy / Traefik target.  
2. Create three Dokploy applications (or one compose): `api`, `admin`, `web`.  
3. Load secrets from Agent Vault into Dokploy env (never commit) — see **Env matrix** below.  
4. Explicit Mestryx OK to deploy staging.  
5. Run migrations: `pnpm --filter @mestryx/api db:migrate` against staging DB (or migrate job).  
6. Seed Luna dogfood (optional): `pnpm --filter @mestryx/api db:seed` with staging `DATABASE_URL` + `SEED_EMAIL` / `SEED_PASSWORD`. Seed marks the admin email verified (required for console sign-in).

## Env matrix (`.env.example` ↔ staging)

| Variable | Staging value | Notes |
|----------|---------------|-------|
| `DATABASE_URL` | Postgres on Dokploy / managed | Migrate before first traffic |
| `REDIS_URL` | Redis service URL | Required for rate limits / sessions as configured |
| `BETTER_AUTH_SECRET` | ≥32 chars | Vault |
| `BETTER_AUTH_URL` | `https://api.staging.mestryx.dev` | Must match public API |
| `TRUSTED_ORIGINS` | `https://admin.staging.mestryx.dev,https://api.staging.mestryx.dev` | Comma-separated |
| `PUBLIC_SITES_HOST_SUFFIX` | `sites.staging.mestryx.dev` | Wildcard DNS |
| `PUBLIC_ADMIN_HOST` / `PUBLIC_API_HOST` | Staging hosts | Align with DNS |
| `ADMIN_ORIGIN` / `WEB_ORIGIN` | Staging HTTPS origins | CORS / cookies |
| `SENTRY_DSN` | Optional | Staging project |
| Stripe keys | **Test mode only** | Capture still deferred (FB-070) |

Confirm every key above exists in repo root `.env.example` before deploy; add missing keys to the example file (no secrets).

## Seed path (Luna Bijoux)

```bash
# Against staging DATABASE_URL (never commit the URL)
export DATABASE_URL='postgresql://…'
export SEED_EMAIL='demo@lunabijoux.local'   # optional override
export SEED_PASSWORD='…'                    # vault / one-time
pnpm --filter @mestryx/api db:migrate
pnpm --filter @mestryx/api db:seed
```

Seed is idempotent (org `luna-bijoux`, site `luna`, products, categories, default variants).

## Images

| App | Dockerfile |
|-----|------------|
| API | `apps/api/Dockerfile` |
| Admin | `apps/admin/Dockerfile` |
| Web SSR | `apps/web/Dockerfile` |

## Staging smoke checklist (post-deploy)

Run after first successful deploy; tick in chat / Kanban:

1. [ ] `GET https://api.staging.mestryx.dev/health` → 200  
2. [ ] Admin `https://admin.staging.mestryx.dev` → login with seed (or create) user  
3. [ ] Admin: list Sites + Products + Categories + Pages for Luna  
4. [ ] Public: `https://luna.sites.staging.mestryx.dev/` → PLP HTML with products; `/?category=colliers` filters  
5. [ ] PDP: pick variant (if >1) → Add to cart → `/cart` shows line  
6. [ ] Checkout → order `pending_payment`  
7. [ ] Admin Orders: mark-paid → invoice PDF opens; cancel another pending restores stock  
8. [ ] `GET …/llms.txt` and sitemap on public site return 200  

## Health

- API: `GET https://api.staging.mestryx.dev/health`  
- Admin: HTTPS 200 on `/`  
- Web: `GET https://{slug}.sites.staging.mestryx.dev/` returns HTML with `<title>` + `/llms.txt`

## Rollback

- Redeploy previous Dokploy deployment / image tag.  
- DB: restore from backup before migration if migration fails (document backup ID).  
- DNS: revert A/CNAME if cutover wrong.

## TLS

- Platform hosts: Traefik + Let’s Encrypt (Q7 phase 1).  
- Custom customer domains: Cloudflare for SaaS later (schema + verify API already in `/v1/domains`).
