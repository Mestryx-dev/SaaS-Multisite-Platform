# ADR-0005: Platform Obsidian Soft palette

**Status**: Accepted  
**Date**: 2026-07-27  
**Supersedes**: [ADR-0003](./0003-platform-night-gold-glass.md) (night-gold accents)

## Context

Night-gold (`#c9a227` on `#07080d`) was the platform lock (ADR-0003). After a live HTML palette preview (`docs/design-system/previews/obsidian-palette-preview.html`), Mestryx chose **Option B — Obsidian Soft** for the admin console: graphite surfaces with a soft lilac accent, closer to Obsidian.md graphite UI without neon purple SaaS gradients.

## Decision Drivers

1. Dark admin identity that feels denser / more “tool” than night-gold ops chrome.
2. Soft lilac accent readable on graphite (not saturated purple mesh).
3. Keep storefront Soft boutique / Luna tokens unchanged.
4. Preserve chrome glass rules (header only) and Inter + Plus Jakarta (ADR-0002).

## Considered Options

1. Keep night-gold — rejected (product chose Obsidian Soft).
2. Obsidian Classic `#7f6df2` — rejected (more neon / Classic Obsidian accent).
3. Obsidian Slate steel `#7dd3fc` — rejected (preview Option C).
4. **Obsidian Soft** `#a78bfa` on graphite — chosen.

## Decision Outcome

- Platform dark: bg `#19191c` · card `#232328` · sidebar `#131316` · border `#34343d` · primary `#a78bfa` · fg `#e6e6ea`.
- `platform-light` companion uses the same lilac family (`#7c5cbf` primary on light surfaces).
- Chrome glass + ambient wash retinted to lilac; storefront untouched.
- Preview HTML kept for future palette tweaks.

## Consequences

- DESIGN.md / brand-brief / tokens / `platform.ts` preset updated.
- ADR-0003 night-gold values are historical; glass policy remains.
- F-01 brand sign-off was against night-gold — re-spot-check admin chrome if staging gate is still open.
