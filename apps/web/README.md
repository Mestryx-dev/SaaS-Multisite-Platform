# apps/web

Public multi-tenant sites with **SSR HTML** (Hono + React-ready document renderer).

Locked SEO/AI surfaces from day one (`docs/11-seo-ai-ready.md`):

- Server-rendered home / legal pages with title, meta, canonical, OG, JSON-LD
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`
- Host resolution via `@mestryx/host-resolution` + API `/v1/public/resolve-host`

TanStack Start remains the documented long-term framework choice in `docs/02-stack.md`; this runtime delivers the same SSR/SEO contract without a SPA-first rewrite.

```bash
pnpm --filter @mestryx/web dev   # :3000
```
