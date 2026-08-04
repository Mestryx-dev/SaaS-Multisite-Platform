#!/usr/bin/env bash
# Prepare Option B orphan reset — DOES NOT force-push.
# Usage: ./scripts/oss-orphan-prepare.sh
# Requires explicit Mestryx OK before any push --force-with-lease.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
BUNDLE="${ROOT}/../SaaS-Multisite-Platform-pre-orphan-${STAMP}.bundle"

echo "==> Creating backup bundle: ${BUNDLE}"
git bundle create "${BUNDLE}" --all

echo "==> Working tree must be clean"
git diff --quiet && git diff --cached --quiet

echo "==> Creating local orphan branch clean-main (no push)"
git checkout --orphan "clean-main-${STAMP}"
git add -A
git status --short | head -50

echo ""
echo "Review the index. If OK, commit locally:"
echo "  git commit -m 'chore: initial public-ready tree'"
echo "Then, only after Mestryx OK:"
echo "  git branch -M main"
echo "  git push --force-with-lease origin main"
echo "Bundle kept at: ${BUNDLE}"
