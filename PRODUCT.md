# PRODUCT.md — mestryx-platform

**Status:** Locked for engineering (visuals provisionally accepted — see DESIGN.md)  
**Updated:** 2026-07-19

## Product

Multi-tenant **CMS + commerce** platform operated by Mestryx. Working name: **mestryx-platform**. Commercial marketing name deferred.

## Surfaces (registers)

| Surface | Mode | Theme | Users |
|---------|------|-------|-------|
| Admin console | **Product** UI | `platform` | Org owners, admins, editors, viewers |
| Public storefront | **Product** chrome; **brand** only for marketing landing slices | `storefront` | Shoppers / customers |
| Remotion promos | Marketing video (not product UI) | N/A | Ads / social |

## Jobs to be done

- Operators: manage sites, content, members, billing, catalog, orders — fast, calm, scannable.
- Shoppers: browse, cart, checkout (payment may be deferred) — trustworthy, readable, brand-distinct per site tokens.

## Voice

Precise, confident, international. Product UI strings: **English**. No hype, no “boost your productivity” fluff.

## Anti-references (do not ship)

- Inter / Roboto / Arial as the **storefront / marketing** brand voice (prefer DESIGN.md fonts). Platform admin intentionally uses Inter (Dokploy-aligned) — see ADR-0002 / DESIGN.md.
- Purple-to-indigo SaaS gradients; Piblox violet `#723CEB`
- Nested cards / card-for-everything layouts
- Gray text on colored backgrounds; pure black/gray without tint
- Bounce/elastic easing; endless decorative motion
- AI-slop icon tiles above every heading

## Design system ownership

- Tokens: `packages/tokens`
- Components: `packages/ui`
- Specs: this file + `DESIGN.md` + `docs/design-system/`
- Agents: skill `mestryx-design-system` + Impeccable detect/polish
