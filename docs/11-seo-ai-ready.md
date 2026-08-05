# SEO + AI discovery — day-one requirements

**Status**: Accepted (Q11 locked)  
**Date**: 2026-07-16  
**Rule**: No SPA-first → SSR later. Public sites ship **SSR + SEO + AI-readable surfaces from the first public page**.

## Decision

| Item | Choice |
|------|--------|
| Public app | **`apps/web` = TanStack Start** (SSR / streaming HTML) |
| Admin app | Vite SPA (no public SEO) — OK |
| SEO fields | In CMS page model from first publishable page |
| AI discovery | `llms.txt` (+ optional `llms-full.txt`) per site |
| Structured data | JSON-LD (Schema.org) on relevant templates |
| Avoid | Client-only public HTML for content pages |

## Why (no-repasse)

Rewriting a Vite SPA into SSR later forces routing, data loading, meta, cache, and deploy changes. Same class of waste as “build UI in admin then extract”. Greenfield → do SSR now.

## Classic SEO (must have with first public content)

| Capability | Feature / implementation note |
|------------|-------------------------------|
| Server-rendered HTML | TanStack Start loaders; content in initial HTML |
| Title + meta description | Per page + site defaults |
| Canonical URL | Per page; respect custom domain when verified |
| Open Graph / Twitter cards | Title, description, image (F-405 assets) |
| `robots.txt` | Per host; allow indexing when site published |
| `sitemap.xml` | Generated from published pages/slugs |
| Semantic HTML | Landmarks, heading order, alt text on images |
| hreflang (when multi-locale) | F-406 — wire when locales ship |
| apex/www + https redirects | F-403 with domains wave |

## AI / GEO readiness (must have with first public content)

| Capability | Note |
|------------|------|
| **`/llms.txt`** | Machine-readable index of important URLs + short descriptions (per site host) |
| Optional **`/llms-full.txt`** | Longer excerpts for key pages (cap size; regenerate on publish) |
| **JSON-LD** | At least `WebSite` + `Organization` (or `LocalBusiness` when relevant); `Article`/`WebPage` for CMS pages |
| **Clean content HTML** | Prefer content in DOM, not only behind client fetch |
| **AI crawler policy** | Explicit `robots.txt` / headers policy for GPTBot, ClaudeBot, etc. (tenant toggle later if needed) |
| **Stable URLs** | Slugs immutable after publish unless redirect row exists |
| **Markdown-friendly exports** (later) | Optional `/…/raw.md` for docs-like sites — not MVP unless the internal trial needs it |

## CMS data model (from first page)

Every publishable page stores at least:

- `title`, `slug`, `status`
- `seo_title`, `seo_description`, `og_image_url` (nullable → fall back to site defaults)
- `canonical_path` (optional override)
- `robots` (`index,follow` / `noindex` …)
- `json_ld` override (optional JSON) or typed fields that generate JSON-LD

Site-level defaults: site name, default OG image, default description, `llms.txt` intro blurb.

## Acceptance checks (CI / QA)

When public runtime exists, add smoke checks (Playwright or fetch):

1. `GET /` returns 200 and **non-empty** body containing the page title in HTML (not only a shell).  
2. `<title>` and `meta name="description"` present.  
3. `link[rel=canonical]` present.  
4. `GET /robots.txt` and `GET /sitemap.xml` 200.  
5. `GET /llms.txt` 200 and lists at least the home URL.  
6. Home HTML contains a `application/ld+json` script.  

## Out of scope for day one (still planned)

- Perfect Core Web Vitals tuning (measure after internal-trial traffic)  
- Per-tenant AI crawler allowlists UI (defaults first)  
- Automatic FAQ schema generation from blocks  
- Multi-language hreflang until F-406  

## Related

- Stack: [02-stack.md](./02-stack.md) § public sites  
- Delivery: [09-delivery-approach.md](./09-delivery-approach.md)  
- Features: F-304 (P0), F-600 SEO fields, F-403, F-405  
- Agent ops: [10-agent-ops.md](./10-agent-ops.md)
