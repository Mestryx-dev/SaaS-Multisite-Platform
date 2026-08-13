# ADR-0006: Platform Mestryx Teal palette

**Status**: Accepted  
**Date**: 2026-08-04  
**Supersedes**: [ADR-0005](./0005-platform-obsidian-soft.md) (Obsidian Soft lilac)

## Context

Obsidian Soft (`#a78bfa` on graphite) was the platform lock (ADR-0005). Product identity now aligns **admin + marketing** color logic with the Mestryx CV stage language (teal / slate / deep stage), while keeping storefront Soft boutique / Luna unchanged and **typography unchanged** (Inter + Plus Jakarta per ADR-0002).

## Decision Drivers

1. Shared Mestryx color language across CV, marketing landing, and admin console.
2. Teal accent readable on dark stage and on light companion — not lilac / purple SaaS mesh.
3. Keep CV **fonts** out of the product (Segoe / Montserrat stay CV-only).
4. Preserve chrome glass rules and storefront presets.

## Considered Options

1. Keep Obsidian Soft lilac — rejected (identity drift vs CV / brand stage).
2. Import CV fonts into platform — rejected (ADR-0002 Inter + Plus Jakarta remain).
3. **Mestryx Teal** colors + color logic only — chosen.

## Decision Outcome

- Platform dark: stage `#0b0f14` · card/chrome `#0f172a` · elevated mid `#334155` · primary on dark `#5eead4` · fg `#e2e8f0`.
- Platform light: paper `#ffffff` · ink `#12141a` · muted `#475569` · line `#e2e8f0` · primary `#115e59`.
- Ambient wash retinted to teal/slate; fonts unchanged.
- Storefront / Luna untouched.

## Consequences

- `platform.ts`, `tokens.css`, DESIGN.md, brand-brief updated.
- ADR-0005 lilac values are historical.
- Marketing landing and admin SPA pick up tokens via `@mestryx/tokens`.
