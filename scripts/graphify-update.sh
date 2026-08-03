#!/usr/bin/env bash
# Rebuild the MVP knowledge graph (AST-only, no LLM).
# Install CLI once: uv tool install graphifyy  (PyPI package graphifyy → command graphify)
set -euo pipefail

if ! command -v graphify >/dev/null 2>&1; then
  echo "error: graphify not found. Install with: uv tool install graphifyy" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Corpus: product apps + shared packages + docs (exclude remotion render outs via .gitignore)
PATHS=(apps/api apps/admin apps/web apps/marketing packages docs)

for p in "${PATHS[@]}"; do
  if [[ ! -d "$p" ]]; then
    echo "[graphify] skip missing $p"
    continue
  fi
  echo "[graphify] update $p"
  graphify update "$p"
done

MERGE_ARGS=()
for p in "${PATHS[@]}"; do
  g="$p/graphify-out/graph.json"
  if [[ -f "$g" ]]; then
    MERGE_ARGS+=("$g")
  fi
done

if [[ ${#MERGE_ARGS[@]} -eq 0 ]]; then
  echo "error: no per-path graphs produced" >&2
  exit 1
fi

mkdir -p graphify-out
graphify merge-graphs "${MERGE_ARGS[@]}" --out graphify-out/graph.json
graphify cluster-only . --no-viz

for p in "${PATHS[@]}"; do
  rm -rf "$p/graphify-out"
done

echo "[graphify] MVP graph updated in graphify-out/"
