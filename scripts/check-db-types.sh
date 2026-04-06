#!/usr/bin/env bash
# Fail CI if generated Supabase types drift from the committed file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="${SUPABASE_PROJECT_ID:-elucgaegaihkklnfoasm}"
OUT="$ROOT/src/types/supabase.gen.ts"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "db:types:check skipped (no SUPABASE_ACCESS_TOKEN); cannot verify drift."
  exit 0
fi

cd "$ROOT"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

npx --yes supabase@latest gen types typescript \
  --project-id "$PROJECT_REF" \
  --schema public \
  >"$TMP"

if ! cmp -s "$TMP" "$OUT"; then
  echo "Supabase types are out of date. Run 'npm run db:types' with SUPABASE_ACCESS_TOKEN and commit src/types/supabase.gen.ts"
  diff -u "$OUT" "$TMP" || true
  exit 1
fi

echo "Supabase types match remote schema."
