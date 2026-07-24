# Agent operations — CI/CD, debug & learning loops

**Status**: Accepted  
**Date**: 2026-07-16  
**Goal**: Make mestryx-platform **agent-friendly by default** so Cursor / Hermes / subagents can build, fail, fix, and retain knowledge without tribal chat memory.

## Principles

1. **Docs + tests beat chat** — if an agent only “knows” it from a previous message, write it down.  
2. **Small vertical slices** — one journey green end-to-end > giant half-finished layers.  
3. **Fail loud in CI** — typecheck, unit, isolation, SEO smoke as features land.  
4. **Every hard fix leaves a trail** — `docs/error-journal.md` and/or a skill.  
5. **No secrets in git** — `.env.example` only; vault for real keys.

---

## 1. Source of truth for agents

| Artifact | Role |
|----------|------|
| [AGENTS.md](../AGENTS.md) | Entry: stack, commands, rules |
| [GAMEPLAN.md](../GAMEPLAN.md) | Phases + estimates |
| [feature-backlog.md](./feature-backlog.md) | **Only** FB-* status SSOT |
| [PROGRESS.md](../PROGRESS.md) | Thin milestones / gates (not per-feature) |
| [06](./06-feature-catalog-and-priority.md) | F-* definitions only |
| [07](./07-dependency-graph.md) | Build order |
| [12](./12-commerce-fiscal-complete.md) | Commerce **target scope** (no status table) |
| [13](./13-journey-audit.md) | Journey **routes / steps** + F/FB refs |
| [09](./09-delivery-approach.md) | No-repasse delivery |
| [11](./11-seo-ai-ready.md) | SSR + SEO + AI discovery |
| [08](./08-open-questions.md) | Stop if blocked by Open Q |
| [error-journal.md](./error-journal.md) | Recurring failures + fixes |
| ADR under `docs/adr/` | Locked decisions |
| OpenAPI / `packages/sdk` | Contract between api ↔ clients |
| [docs/README.md](./README.md) | Ownership matrix |

**Session bootstrap**: Hindsight recall with `project:saas-multisite-platform` before non-trivial work; retain decisions after milestones (not every file edit).

---

## 2. Local loop (human or agent)

```bash
cp .env.example .env
docker compose up -d          # Postgres + Redis
pnpm install
pnpm --filter @mestryx/api db:migrate
pnpm test
pnpm typecheck
pnpm build
pnpm dev:api                  # :3001
# later: pnpm dev:admin / pnpm dev:web
```

**Definition of “slice done”**:

- [ ] Tests green for the change  
- [ ] Typecheck / build OK  
- [ ] Feature ID mentioned in commit (`feat(F-104): …`) when applicable  
- [ ] **Docs sync loop** completed (see §2.2) — not optional  
- [ ] Isolation tests if tenancy touched  
- [ ] SEO smoke if public HTML touched ([11](./11-seo-ai-ready.md))  
- [ ] **Commit + push to `origin`** (see §2.1)

### 2.1 Git loop (systematic — Mestryx policy)

After each validated slice (or coherent docs+code batch):

1. Run `pnpm typecheck && pnpm test && pnpm build` (and relevant package filters).  
2. If green → `git commit` (conventional message) → `git push origin HEAD`.  
3. If red → **do not commit**; fix, re-run, then commit+push.  
4. Never push known-broken `main`. Never `--no-verify` unless Mestryx asks.  
5. Production deploy still needs **explicit human confirm** (not implied by push).

### 2.2 Docs sync loop (systematic — Mestryx policy)

**Problem this solves:** code ships, chat remembers, backlog stays stale → agents plan from lies.

**Rule:** a slice is **not done** until the living docs match the code. Same commit as the feature when possible; docs-only commit immediately after if tests forced a split.

#### Source-of-truth hierarchy (do not invent a second status file)

| Rank | Artifact | What it answers |
|------|----------|-----------------|
| 1 | Code + tests | What exists |
| 2 | [feature-backlog.md](./feature-backlog.md) | Executable FB-* statuses (`todo`/`doing`/`done`/`deferred`) — **only** status SSOT |
| 3 | [PROGRESS.md](../PROGRESS.md) | Thin milestones / release gates |
| 4 | Catalog [06](./06-feature-catalog-and-priority.md) | F-* definitions — never living “done” |
| 5 | [12](./12-commerce-fiscal-complete.md) / [13](./13-journey-audit.md) | Scope / journeys — change only when **scope** or **routes** change |

Chat, Hindsight, and [plans/](./plans/) are **hints / historical**, never status SSOT.

#### Mandatory checklist (every behaviour / contract / schema slice)

Run in order before claiming done:

1. **feature-backlog.md** — set matching `FB-*` (or add a row) to `done` / `doing` / `deferred`; never leave Phase rows stuck on `todo` after code exists.  
2. **PROGRESS.md** — tick a **milestone** only if phase-level (not every FB).  
3. **data-dictionary.yaml** — if schema/API fields changed.  
4. **OpenAPI / `packages/sdk`** — if public HTTP surface changed.  
5. **Scope docs** — edit [12](./12-commerce-fiscal-complete.md) / [13](./13-journey-audit.md) / [06](./06-feature-catalog-and-priority.md) only when **scope or routes** change — **do not** patch status into them.  
6. **error-journal.md** — if a non-obvious bug was fixed.  
7. **GAMEPLAN.md** — only if phase outcomes or estimates materially changed.  
8. SEO/public contract notes in [11](./11-seo-ai-ready.md) / ADR / [08](./08-open-questions.md) only when those decisions change.

#### Anti-patterns

- Updating PROGRESS but leaving `feature-backlog.md` on Phase-2 `todo`.  
- Writing “done” only in the PR description / chat.  
- Expanding [06](./06-feature-catalog-and-priority.md) or [12](./12-commerce-fiscal-complete.md) with parallel status that drifts from the backlog.  
- Updating journey gap catalogs in [13](./13-journey-audit.md) for status.  
- Skipping docs sync because “we’ll clean later”.

#### Agent prompt self-check (paste into Definition of Done)

```
Docs sync: backlog FB-*? PROGRESS milestone (if phase)? data-dictionary/OpenAPI if schema? Do NOT touch 06/12/13 for status.
```

---

## 3. CI/CD (GitHub Actions → Dokploy)

### CI (required, expand as apps land)

| Gate | When | Command / check |
|------|------|-----------------|
| Install | always | `pnpm install --frozen-lockfile` |
| Typecheck | always | `pnpm typecheck` |
| Unit / API tests | always | `pnpm test` |
| Build | always | `pnpm build` |
| Tenant isolation | Phase 2+ | dedicated Vitest suite; **block merge** if fail |
| Lint/format | when Biome wired | `pnpm lint` |
| Playwright smoke | Phase 3+ admin, Phase 4+ web | auth shell + public SSR/SEO checks |
| OpenAPI drift | when sdk generated | fail if generated SDK dirty |

Current workflow: `.github/workflows/ci.yml` (typecheck / test / build). Extend — do not replace with a silent “deploy anyway” path.

### CD (Dokploy)

| Env | Trigger | Notes |
|-----|---------|-------|
| Preview / staging | PR or `staging` branch (Q9) | Separate hosts; no prod secrets |
| Production | Explicit Mestryx confirm | Rollback documented before first stateful deploy |

**Never**: agent-initiated prod deploy without human confirmation (workspace rule).

### Agent-friendly CI output

- Prefer clear job names (`typecheck`, `test-api`, `test-isolation`, `seo-smoke`).  
- On failure, logs must show file + assertion (no swallowed errors).  
- Keep Node/pnpm versions pinned in workflow + `.nvmrc` / `packageManager`.

---

## 4. Debug loop (systematic)

When something fails, agents follow this order (not random retries):

```
1. Reproduce with exact command from CI or README
2. Read error + nearest docs (error-journal, ADR, AGENTS)
3. Minimal fix + add/adjust test that would have caught it
4. Re-run same command until green
5. Append error-journal entry if non-obvious (symptom → cause → fix)
6. Retain Hindsight only for decisions / recurring pitfalls
```

| Layer | How agents debug |
|-------|------------------|
| API | Vitest + `curl` `/health`; structured JSON errors `{ code, message }` |
| DB | Drizzle migrations; never hand-edit prod schema |
| Auth | Better Auth docs + session cookie tests |
| Tenancy | Isolation tests first suspect on “wrong data” |
| Public SSR | View page source / fetch HTML (not only browser SPA check) |
| Deploy | Dokploy logs + Traefik; Memorizer for live UUIDs (homelab) |

Use skill **systematic-debugging** for multi-step failures; do not thrash packages.

---

## 5. Learning loop (persist what worked)

After complex work, errors overcome, or Mestryx corrections:

| Outcome | Persist where |
|---------|----------------|
| Recurring technical fix | `docs/error-journal.md` |
| Reusable procedure for this repo | skill under `.agents/skills/` or workspace skill (see learning-loop) |
| Product / stack decision | ADR + update `08` / `02` |
| Ops fact (hosts, Dokploy IDs) | Memorizer (homelab) — not duplicated as SSOT in repo |
| Session continuity | Hindsight `retain` with `project:saas-multisite-platform` + `area:*` |

**Anti-patterns**: retaining secrets; retaining “Proposal A/B” debates; duplicating Memorizer UUIDs into markdown as truth.

---

## 6. Repo conventions that help agents

| Convention | Why |
|------------|-----|
| Feature IDs (`F-104`) in backlog + commits | Traceability |
| English code/docs | Consistent tooling |
| One REST API | No dual contracts |
| `packages/ui` first | No extract-later |
| TanStack Start for `apps/web` | No SPA→SSR rewrite |
| `.env.example` complete | Agents can boot without asking for secrets values |
| Small PRs / commits | Reviewable by human + Bugbot |
| `docs/plans/` for large slices | Validation before huge diffs |

### Suggested Cursor / Hermes surface (add when useful)

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Already required |
| `.cursor/rules/` | Short repo rules (tenancy, UI, SEO) if IDE rules help |
| `.agents/skills/` | Project-specific skills after first hard lessons |
| `docs/error-journal.md` | Debug memory |
| `docs/plans/YYYY-MM-DD-*.md` | Implementation plans before big phases |

---

## 7. Quality bars by phase

| Phase | Extra agent gates |
|-------|-------------------|
| 2 Identity | Isolation tests mandatory |
| 3 Admin | `@mestryx/ui` imports; no duplicate Button in app |
| 4 Public | SSR HTML + SEO/AI checklist ([11](./11-seo-ai-ready.md)) |
| 5 Domains | Verify + TLS runbook with rollback |
| 6 Billing | Stripe webhook test matrix before live |

---

## 8. Estimate impact

Making SEO/AI + agent ops **correct from the start** adds roughly **+15–25%** to Phase 4 (public runtime) vs a shell SPA, and **~0.5–1 day** upfront for CI/SEO smoke scaffolding when web lands. Saves a later multi-week rewrite.

Uncertainty: ±30% until first Dokploy staging deploy (Q9).

## Related

- [09-delivery-approach.md](./09-delivery-approach.md)  
- [11-seo-ai-ready.md](./11-seo-ai-ready.md)  
- Workspace: learning-loop skill, systematic-debugging skill
