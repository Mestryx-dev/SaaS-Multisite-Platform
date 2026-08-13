# OSS public readiness checklist

**Status:** Waves 0–2 applied on branch `feat/oss-public-readiness` (2026-08-04).  
**Licence:** Apache-2.0 + [NOTICE](../../NOTICE) trademark note.  
**Visibility today:** GitHub repo still **PRIVATE** until Wave 3 human gate.  
**History rewrite:** Option B orphan — **requires explicit Mestryx OK** (agents must not force-push alone).  
**Backup:** `~/WorkSpace/backups/SaaS-Multisite-Platform-oss-prep-20260804.bundle`

Related: [repo-history-hygiene.md](./repo-history-hygiene.md) · [SECURITY.md](../SECURITY.md) · root [SECURITY.md](../../SECURITY.md)

---

## Locked decisions

| Decision | Choice |
|----------|--------|
| Licence | Apache-2.0 + NOTICE |
| Branding | Mestryx remains upstream product brand in marketing copy |
| Forks | Empty / placeholder `PUBLIC_*` defaults; demo hosts only in `.env.example` comments |
| Private ops | Dokploy UUIDs, LAN, Memorizer links → out of git |
| History | Option B orphan before first PUBLIC (human OK) |

---

## Wave 0 — Inventory

| Item | Status |
|------|--------|
| `gh repo view` private | Done (PRIVATE at prep) |
| Tracked `.env` / pem | None |
| Secret pattern scan (working tree) | Placeholders only in `.env.example` |
| History seed password residual | Present in old commits → forces orphan before PUBLIC |
| Bundle backup | Done — `SaaS-Multisite-Platform-oss-prep-20260804.bundle` |
| Oversized `graphify-out/graph.json` | Untracked + gitignored |

---

## A. Licence and legal

| # | Element | Status |
|---|---------|--------|
| A1 | Root `LICENSE` Apache-2.0 | Done |
| A2 | `NOTICE` | Done |
| A3 | README licence section | Done |
| A4 | `license` in root `package.json` | Done |
| A5 | Marketing legal drafts labeled | Done (i18n draft notices) |
| A6 | Third-party attributions | NOTICE + dependency licenses |
| A7 | CLA / DCO | Deferred (none for v1) |
| A8 | Trademark note | Done in NOTICE + README |

---

## B. Community and GitHub

| # | Element | Status |
|---|---------|--------|
| B1 | Root `SECURITY.md` | Done |
| B2 | `CONTRIBUTING.md` | Done |
| B3 | `CODE_OF_CONDUCT.md` | Done |
| B4 | SUPPORT / Discussions | Nice — Issues only for v1 |
| B5 | Issue templates | Done |
| B6 | PR template | Done |
| B7 | Dependabot | Done |
| B8 | Secret scanning / push protection | **Ops after PUBLIC** |
| B9 | Soften `AGENTS.md` | Done |

---

## C. Secrets, env, ignore

| # | Element | Status |
|---|---------|--------|
| C1 | Tracked env = examples only | Done |
| C2 | Local `.env` ignored | Done |
| C3 | `graphify-out/` fully ignored | Done |
| C4 | `.dockerignore` tightened | Done |
| C5 | `SEED_PASSWORD` required (no default) | Done |
| C6 | CI disposable secrets | OK (documented) |
| C7 | Compose local postgres | OK (documented) |
| C8 | Docker ARG defaults | OK |
| C9 | Marketing `site.ts` fork-safe | Done |
| C10 | Umami / Dokploy IDs absent from source | Done |
| C11 | History residual | Pending orphan (Wave 3) |
| C12 | Credential rotation after PUBLIC | Ops checklist |
| C13 | `pnpm audit` triage | See findings below |
| C14 | Auth/session spot-check | Documented in SECURITY.md |

### Audit triage (2026-08-04)

| Severity | Package | Action |
|----------|---------|--------|
| high | `fast-uri` (transitive) | Monitor; no direct dep — revisit when parents bump |
| moderate | `hono` / `@hono/node-server` / `postcss` / `esbuild` (paths vary) | Bumped `hono` + `@hono/node-server` to latest compatible; re-run `pnpm audit` after next lock refresh |
| — | Critical live secrets | None found in working tree |

---

## D. Private infra scrub

| # | Element | Status |
|---|---------|--------|
| D1–D5 | Dokploy UUIDs / LAN / Memorizer from smoke runbook | Done (generic rewrite) |
| D6 | `docs/00-identity-and-context.md` | Done |
| D7 | `docs/10-agent-ops.md` | Softened |
| D8 | `docs/integrations.md` | Softened |
| D9 | `docs/SECURITY.md` | Done |
| D10 | Staging runbook vault wording | Softened |
| D11 | GTM plans | OK |
| D13 | README hosts | Public product hosts only |

---

## E–I. Docs, branding, CI

| Area | Status |
|------|--------|
| E1–E2 README + quickstart | Done |
| F1–F2 site.ts + env examples | Done |
| G1–G3 graphify untracked | Done |
| I3 Remotion CI gated | Done (`workflow_dispatch` / `main` / label `remotion`) |
| I4–I5 Branch protection / deploy secrets | **Ops after PUBLIC** |

---

## J. Git history and go-public (Wave 3 — human)

**Do not run force-push or flip Public without Mestryx confirmation in the same session.**

### Pre-flight (agent / maintainer)

1. [ ] Merge Waves 1–2 PR into `dev`, then `main` as usual  
2. [ ] CI green on tip  
3. [ ] Bundle backup current (re-run if new commits)  
4. [ ] Fresh-clone smoke (below) on the cleaned tree **before** orphan if desired  

### Orphan Option B (human)

```bash
cd repositories/SaaS-Multisite-Platform
git fetch origin
git bundle create ../SaaS-Multisite-Platform-pre-orphan-$(date +%Y%m%d).bundle --all
git checkout main
git pull origin main
git checkout --orphan clean-main
git add -A
git status   # confirm no .env, no graphify-out artifacts
git commit -m "chore: initial public-ready tree"
# Mestryx OK required:
# git branch -M main
# git push --force-with-lease origin main
# Decide fate of origin/dev (reset or delete + recreate)
```

### After rewrite

5. [ ] Flip GitHub → **Public**  
6. [ ] Enable secret scanning + push protection + Dependabot alerts  
7. [ ] Rotate any credential that ever appeared in old history  
8. [ ] Update private Memorizer fiche (Public date); keep Dokploy IDs private  
9. [ ] Announce: fresh clone required  

### Rollback

Keep private mirror + bundle; set visibility back to Private; restore branch from bundle.

---

## Fresh-clone QA

```bash
cd /tmp
git clone https://github.com/Mestryx-dev/SaaS-Multisite-Platform.git oss-smoke
cd oss-smoke
cp .env.example .env
# set SEED_PASSWORD=local-only-test
docker compose up -d
pnpm install
pnpm --filter @mestryx/api db:migrate
SEED_PASSWORD=local-only-test pnpm --filter @mestryx/api db:seed
pnpm --filter @mestryx/marketing build   # must succeed without Mestryx PUBLIC_* defaults
pnpm typecheck && pnpm test
```

Expect: marketing builds with `example.com` placeholders; seed fails without `SEED_PASSWORD`.

---

## Out of scope

- Lawyer review of legal pages  
- Renaming GitHub org / `@mestryx/*` npm publish  
- Making Dokploy / Memorizer public  
