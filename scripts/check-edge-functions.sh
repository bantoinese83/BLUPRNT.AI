#!/usr/bin/env bash
# Type-check each Supabase Edge Function entrypoint (requires Deno 2+ on PATH).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DENO_NO_PROMPT=1

DENO_BIN=(deno)
if ! command -v deno &>/dev/null; then
  DENO_BIN=(npx --yes deno@2.1.4)
fi

CONFIG="$ROOT/supabase/functions/deno.json"

FILES=(
  supabase/functions/create-checkout/index.ts
  supabase/functions/delete-account/index.ts
  supabase/functions/get-invoice/index.ts
  supabase/functions/get-project-view/index.ts
  supabase/functions/photo-to-scope/index.ts
  supabase/functions/send-email/index.ts
  supabase/functions/stripe-webhook/index.ts
  supabase/functions/upload-invoice/index.ts
)

for f in "${FILES[@]}"; do
  echo "deno check $f"
  "${DENO_BIN[@]}" check --config "$CONFIG" "$f"
done
