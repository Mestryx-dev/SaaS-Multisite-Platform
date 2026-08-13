# Security Policy

## Reporting a vulnerability

Email **security@mestryx.dev** (or open a **private** GitHub security advisory on this repository).

Please include:

- Affected component (`apps/api`, `apps/admin`, `apps/web`, `apps/marketing`, …)
- Description and impact
- Reproduction steps or proof-of-concept (no production secrets)

We aim to acknowledge within **7 days**. Do not open public issues for exploitable vulnerabilities until a fix or coordinated disclosure is agreed.

## Supported versions

Security fixes target the default branch (`main` / `dev` integration line). Older tags may not receive backports.

## Rules for contributors and operators

1. **Never commit secrets** — `.env`, API keys, tokens, private keys, vault dumps.
2. Use your orchestrator’s secret store (Dokploy/Coolify env, Infisical, etc.) for real credentials.
3. Committed templates are [`.env.example`](.env.example) and [`apps/marketing/.env.example`](apps/marketing/.env.example) only (placeholders).
4. Local demo seed requires `SEED_PASSWORD` (and optional `SEED_EMAIL`) — **local/dev only**; never reuse on staging/prod.
5. CI may use disposable secrets (e.g. `BETTER_AUTH_SECRET` in GitHub Actions) — never production values.

Full operator notes: [`docs/SECURITY.md`](docs/SECURITY.md).  
History rewrite before public release: [`docs/runbooks/repo-history-hygiene.md`](docs/runbooks/repo-history-hygiene.md).  
OSS readiness checklist: [`docs/runbooks/oss-public-readiness.md`](docs/runbooks/oss-public-readiness.md).
