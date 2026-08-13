# Marketing NYC Night theme

**Date:** 2026-08-13  
**Branch:** `feat/marketing-nyc-night`  
**Status:** Implemented locally (PR to `dev`)

## Goal

Apply NYC Night (night-gold) to `apps/marketing` only. Admin stays Mestryx Teal (ADR-0006). See [ADR-0008](../adr/0008-marketing-nyc-night.md).

## Token map (`data-theme="marketing"`)

| Role | Value |
|------|-------|
| Background | `#07080d` |
| Ambient | Gold + soft blue radials + `#0b0d14`→`#07080d` linear |
| Card / secondary | `#10131c` / `#161a26` |
| Foreground / muted | `#f5f3ef` / `#9ca3af` |
| Border | `#252a3a` |
| Primary / accent | `#c9a227` / `#d4af37` |
| On primary | `#07080d` |
| Glass / glow | `#10131ceb`, `#ffffff1f`, blur 16px, `#c9a22740` |

## Commits

1. `feat(tokens): add marketing NYC Night theme preset`
2. `feat(marketing): switch landing to marketing theme`
3. `feat(marketing): NYC Night ambient wash and header glass`
4. `fix(marketing): replace teal hardcodes with theme tokens`
5. `docs(adr): marketing NYC Night surface vs platform teal`

## Verify

- `rg '5eead4' apps/marketing` empty
- Computed `--primary` `#c9a227` on `/fr` and `/en`
- ProductStage image ratios unchanged (~4:3 / ~390:844)
- Cookie banner bottom-start, gold primary button
