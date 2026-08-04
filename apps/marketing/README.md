# apps/marketing — product landing (mestryx.dev)

Astro 7 static site · FR + EN · Obsidian Soft tokens · personalization via `PUBLIC_*` env.

```bash
cp apps/marketing/.env.example apps/marketing/.env   # optional local overrides
pnpm --filter @mestryx/marketing dev                 # http://localhost:4321 → /fr
pnpm --filter @mestryx/marketing build
```

## Open-source / fork knobs (build-time)

All `PUBLIC_*` values are baked at **build** time (static HTML). On Dokploy, set them as **Docker build arguments**, not only runtime container env.

| Variable | Purpose | Default if unset |
|----------|---------|------------------|
| `PUBLIC_SITE_URL` | Canonical marketing URL in legal copy | `https://mestryx.dev` |
| `PUBLIC_CONTACT_EMAIL` | Contact / legal mailto | `contact@mestryx.dev` |
| `PUBLIC_LINK_DEMO_ADMIN` | Hero CTA | demo-admin host |
| `PUBLIC_LINK_DEMO_STORE` | Hero CTA | demo-web host |
| `PUBLIC_LINK_PORTFOLIO` | Hero CTA | portfolio host |
| `PUBLIC_UMAMI_SCRIPT_URL` | Umami `script.js` | *(empty = no analytics)* |
| `PUBLIC_UMAMI_WEBSITE_ID` | Umami website UUID | *(empty = no analytics)* |
| `PUBLIC_UMAMI_SHARE_URL` | Public share dashboard link in footer | *(optional)* |
| `PUBLIC_ANALYTICS_HOST` | Host name in privacy copy | origin of script URL |

Legal prose uses `{{contactEmail}}`, `{{siteUrl}}`, etc. Brand narrative (Mestryx) lives in `src/i18n/{fr,en}.json` — forks rebrand there.

Docker: `apps/marketing/Dockerfile`.
