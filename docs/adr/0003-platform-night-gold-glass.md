# ADR-0003: Platform night-gold theme + chrome glass

**Status**: Superseded by [ADR-0005](./0005-platform-obsidian-soft.md)  
**Date**: 2026-07-23  
**Superseded**: 2026-07-27

## Context

Admin platform used a blue-slate opaque lock (`#3d8bfd`). Product direction requires a denser, richer admin identity: deep night surfaces, gold primary actions, and restrained chrome glass (top bar / sticky panels) while storefront Soft boutique stays unchanged.

## Decision Drivers

1. Distinctive admin identity without purple SaaS defaults.
2. Readable gold CTAs (dark text on gold).
3. Glass only where atmosphere helps; never on data cells or solid CTAs.
4. Dual-theme integrity (storefront tokens untouched).

## Considered Options

1. Keep blue opaque — reject (product wants night-gold).
2. Full-page glass / grain — reject (hurts density and a11y).
3. **Night-gold + chrome glass** — chosen.

## Decision Outcome

- Platform tokens: bg `#07080d` / surface `#10131c` / accent `#c9a227` (OKLCH in `tokens.css`).
- `--font-display` = Plus Jakarta Sans; `--font-sans` = Inter.
- `--glass-*` + `--glow-accent` on platform; AppShell top bar uses glass.
- DESIGN.md Wave E for platform: chrome glass allowed as above.

## Consequences

- Primary buttons and rings become gold; Storybook foundations update.
- Docs/CHANGELOG say “platform night-gold” (no third-party brand names in user-facing copy).
- `ds:detect` may flag Inter / Plus Jakarta as overused — intentional; ignored in `.impeccable/config.json` (ADR-0002 Inter, ADR-0003 Plus Jakarta).
