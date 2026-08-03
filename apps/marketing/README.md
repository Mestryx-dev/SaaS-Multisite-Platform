# apps/marketing — product landing (mestryx.dev)

Astro 7 static site · FR + EN · Obsidian Soft tokens · Umami opt-in via env.

```bash
pnpm --filter @mestryx/marketing dev     # http://localhost:4321 → /fr
pnpm --filter @mestryx/marketing build
```

Docker: `apps/marketing/Dockerfile` (nginx). Build args: `PUBLIC_UMAMI_*`.

Legal drafts + cookie consent ship with the app. Contact: `contact@mestryx.dev`.
