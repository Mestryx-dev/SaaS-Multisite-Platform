# Security

**Status:** SSOT for secrets and public-repo hygiene  
**Last updated:** 2026-07-24

## Rules

1. **Never commit secrets** — `.env`, API keys, tokens, private keys, vault dumps.
2. Use **Agent Vault / Infisical / Dokploy env** for real credentials (see [integrations.md](./integrations.md), [runbooks/staging-dokploy.md](./runbooks/staging-dokploy.md)).
3. Repo root [`.env.example`](../.env.example) is the only committed env template (placeholders only).
4. Local dogfood seed (`SEED_EMAIL` / `SEED_PASSWORD`) is **local/dev only** — do not reuse on staging/prod; set from vault when seeding remote DBs.
5. CI may use disposable secrets (e.g. `BETTER_AUTH_SECRET` in GitHub Actions) — never production values.

## What is OK in git

| Item | Why |
|------|-----|
| `.env.example` placeholders | Onboarding |
| `docker-compose.yml` local `postgres`/`postgres` | Local-only compose |
| Public hostnames (`*.mestryx.dev`) | Product DNS |
| Seed email domain `*.local` | Non-routable dogfood |

## What is NOT OK

| Item | Action |
|------|--------|
| Real `STRIPE_*`, `RESEND_*`, OAuth secrets | Rotate if ever leaked; keep in vault |
| Private `.lan` IPs, vault tokens, personal chat pastes | Keep out of this repo |
| `.impeccable/critique/` dumps | Gitignored — local tool noise |

## History hygiene

Before a **public** or **fresh-start** history rewrite, follow [runbooks/repo-history-hygiene.md](./runbooks/repo-history-hygiene.md).
