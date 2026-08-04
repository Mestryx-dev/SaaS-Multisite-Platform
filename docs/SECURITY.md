# Security

**Status:** SSOT for secrets and public-repo hygiene  
**Last updated:** 2026-08-04

## Rules

1. **Never commit secrets** — `.env`, API keys, tokens, private keys, vault dumps.
2. Use your orchestrator secret store or a vault product for real credentials (see [integrations.md](./integrations.md), [runbooks/staging-dokploy.md](./runbooks/staging-dokploy.md)).
3. Repo root [`.env.example`](../.env.example) and [`apps/marketing/.env.example`](../apps/marketing/.env.example) are the only committed env templates (placeholders only).
4. Local dogfood seed (`SEED_EMAIL` / **required** `SEED_PASSWORD`) is **local/dev only** — do not reuse on staging/prod. The Luna seed **auto-verifies** the admin email for console login (dogfood convenience only — not a production auth pattern).
5. CI may use disposable secrets (e.g. `BETTER_AUTH_SECRET` in GitHub Actions) — never production values.
6. Report vulnerabilities to **security@mestryx.dev** (or GitHub private advisory) — see root [`SECURITY.md`](../SECURITY.md).

## What is OK in git

| Item | Why |
|------|-----|
| `.env.example` placeholders | Onboarding |
| `docker-compose.yml` local `postgres`/`postgres` | Local-only compose |
| Public product hostnames (documentation) | DNS examples |
| Seed email domain `*.local` | Non-routable dogfood |

## What is NOT OK

| Item | Action |
|------|--------|
| Real `STRIPE_*`, `RESEND_*`, OAuth secrets | Rotate if ever leaked; keep in vault |
| Private LAN IPs, orchestrator UUIDs, internal wiki URLs | Keep out of this repo |
| Default seed passwords in source | Removed — `SEED_PASSWORD` required |
| `.impeccable/critique/` dumps | Gitignored — local tool noise |

## Threat model (brief)

- **Tenant isolation** — org/site scoped queries; isolation tests must stay green before public site features.
- **Auth** — Better Auth cookies; no secrets in application logs; rate limits on auth routes where configured.
- **Headers** — API security headers middleware (`apps/api/src/middleware/security-headers.ts`).
- **Analytics** — optional Umami via env; consent-gated on marketing; no third-party GA by default.

## History hygiene

Before a **public** or **fresh-start** history rewrite, follow [runbooks/repo-history-hygiene.md](./runbooks/repo-history-hygiene.md) and [runbooks/oss-public-readiness.md](./runbooks/oss-public-readiness.md).
