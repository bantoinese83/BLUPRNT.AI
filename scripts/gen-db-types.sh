#!/usr/bin/env bash
# Generate web/src/types/supabase.gen.ts from the Supabase project (requires CLI auth).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/web/src/types/supabase.gen.ts"
PROJECT_REF="${SUPABASE_PROJECT_ID:-elucgaegaihkklnfoasm}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "db:types skipped: set SUPABASE_ACCESS_TOKEN (and optionally SUPABASE_PROJECT_ID) to regenerate types."
  exit 0
fi

cd "$ROOT"
npx --yes supabase@latest gen types typescript \
  --project-id "$PROJECT_REF" \
  --schema public \
  >"$OUT"

echo "Wrote $OUT"
