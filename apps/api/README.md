# `@mestryx/api`

Hono API for Mestryx Multisite Platform (Phase 1 skeleton).

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| GET | `/health/ready` | Readiness (DB when `DATABASE_URL` set) |

## Local

```bash
# from repo root
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter @mestryx/api db:generate   # if schema changed
pnpm --filter @mestryx/api db:migrate
pnpm dev:api
```

- API: http://localhost:3001  
- Deploy target: Dokploy → `api.mestryx.dev` (later)
