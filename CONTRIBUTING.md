# Contributing

Thanks for contributing to **mestryx-platform**.

## Ground rules

- Code, comments, commit messages, and durable docs: **English**.
- **No secrets** in commits or PR descriptions (`.env`, API keys, tokens, private keys).
- Prefer small PRs with tests / docs for behaviour changes.
- Conventional commit style encouraged (`feat:`, `fix:`, `docs:`, `chore:`).

## Branches

| Branch | Role |
|--------|------|
| `main` | Stable / release line |
| `dev` | Integration (upstream) |
| `feat/*`, `fix/*`, `docs/*` | Short-lived work |

Open PRs against `dev` unless maintainers ask otherwise.

## Local setup

See root [README.md](README.md) quickstart. Minimum before PR:

```bash
pnpm install
pnpm check:i18n
pnpm typecheck
pnpm test
pnpm build
```

Seed requires `SEED_PASSWORD` in `.env` (see `.env.example`).

## Pull requests

Use the PR template checklist. Include:

- Why the change exists
- How you verified it
- Docs / backlog updates when behaviour or API contracts change (`docs/feature-backlog.md`)

## Security

Report vulnerabilities privately — [SECURITY.md](SECURITY.md).

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
