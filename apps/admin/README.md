# Admin (SaaS back-office)

**http://localhost:5174/** — tab title must be `mestryx-platform admin`.

Do **not** use `:5173` for this app (often another Vite scaffold / browser cache).

## Dev

From repo root:

```bash
pnpm dev:all          # api :3001 + admin :5174 + web :3002
```

Sign in: http://localhost:5174/sign-in  
Products: http://localhost:5174/products  

Local dogfood account: run `pnpm db:seed` then use `SEED_EMAIL` / `SEED_PASSWORD` from your local `.env` (see `.env.example`). Never commit real passwords.
