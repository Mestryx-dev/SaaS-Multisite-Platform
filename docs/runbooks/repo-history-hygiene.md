# Repo history hygiene — prepare squash / orphan reset

**Purpose:** Make a clean first public (or rebased) history without secret or junk traces.  
**Status:** Prep only — **do not** force-push or orphan-reset without explicit Mestryx confirmation.  
**Related:** [SECURITY.md](../SECURITY.md)

## Audit snapshot (2026-07-24)

| Check | Result |
|-------|--------|
| Tracked `.env` | **No** (only `.env.example`) |
| Live-looking Stripe/Resend/GitHub tokens in blobs | **None found** |
| Branches | `main` only (+ `origin/main`) |
| Local `.env` | Present, gitignored; no obvious live provider keys |
| Demo seed password in README | **Removed** (use env) |
| Ephemeral critique dumps | **Gitignored** (`.impeccable/critique/`) |

Residual (acceptable for private dogfood, scrub on public open-source if desired):

- Default seed password fallback in `apps/api/src/db/seed-luna-bijoux.ts` (local DX).
- Compose/CI disposable Postgres / `BETTER_AUTH_SECRET` placeholders.
- Historical commits still contain older README seed string until history is rewritten.

## Pre-purge checklist (working tree)

- [x] `.gitignore` / `.cursorignore` cover `.env*`, keys, critique
- [x] Docs point to vault; no plaintext seed password in admin README
- [ ] `pnpm check:i18n` + typecheck green on tip
- [ ] Confirm nothing sensitive in **unpushed** commits (`git log origin/main..HEAD`)
- [ ] Backup: `git bundle create ../SaaS-Multisite-Platform-backup.bundle --all`

## Option A — squash unpushed tip only (safe if already pushed base is clean)

If only recent local commits need squash:

```bash
git fetch origin
git rebase -i origin/main   # squash into one commit
# or: git reset --soft origin/main && git commit
```

## Option B — orphan single-commit reset (full history rewrite)

**Destructive.** Rewrites all history. Requires force-push and collaborator coordination.

```bash
git bundle create ../SaaS-Multisite-Platform-backup.bundle --all
git checkout --orphan clean-main
git add -A
git commit -m "chore: initial public-ready tree"
# After Mestryx OK:
# git branch -M main
# git push --force-with-lease origin main
```

Optional: delete remote leftover branches (`git push origin --delete <branch>`) — currently only `main`.

## After rewrite

1. Rotate any credential that might have appeared in old history (even placeholders reused elsewhere).
2. Confirm GitHub secret scanning / Dependabot alerts.
3. Update clone docs: fresh clone required after force-push.

## Explicit non-goals

- Do not paste vault secrets into chat to “verify”.
- Do not run `git push --force` from an agent without Mestryx OK in the same turn.
