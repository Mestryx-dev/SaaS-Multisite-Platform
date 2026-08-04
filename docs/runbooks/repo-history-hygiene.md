# Repo history hygiene — prepare squash / orphan reset

**Purpose:** Make a clean first public (or rebased) history without secret or junk traces.  
**Status:** Prep only — **do not** force-push or orphan-reset without explicit Mestryx confirmation.  
**Related:** [SECURITY.md](../SECURITY.md)

## Audit snapshot (2026-08-04 OSS prep)

| Check | Result |
|-------|--------|
| Tracked `.env` | **No** (only `.env.example` + marketing example) |
| Live-looking Stripe/Resend/GitHub tokens in working tree | **None found** |
| Default seed password in source | **Removed** (`SEED_PASSWORD` required) |
| `graphify-out/` | **Untracked** + gitignored |
| Private Dokploy UUIDs / LAN in smoke runbook | **Scrubbed** |
| Historical commits still contain older seed string | **Yes** → Option B before PUBLIC |
| Bundle | `~/WorkSpace/backups/SaaS-Multisite-Platform-oss-prep-20260804.bundle` |

Full checklist: [oss-public-readiness.md](./oss-public-readiness.md).

## Pre-purge checklist (working tree)

- [x] `.gitignore` / `.cursorignore` cover `.env*`, keys, critique, `graphify-out/`
- [x] Docs point to vault; no plaintext seed password in source
- [ ] `pnpm check:i18n` + typecheck green on tip (run before merge)
- [ ] Confirm nothing sensitive in **unpushed** commits (`git log origin/main..HEAD`)
- [x] Backup: bundle under `WorkSpace/backups/`

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
