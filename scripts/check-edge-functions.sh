#!/usr/bin/env bash
# Type-check each Supabase Edge Function entrypoint (requires Deno 2+ on PATH).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DENO_NO_PROMPT=1

DENO_BIN=(deno)
if ! command -v deno &>/dev/null; then
  DENO_BIN=(npx --yes deno@2.7.11)
fi

CONFIG="$ROOT/supabase/functions/deno.json"

FILES=(
  supabase/functions/chat-with-project/index.ts
  supabase/functions/check-subscription-status/index.ts
  supabase/functions/cleanup-storage/index.ts
  supabase/functions/create-checkout/index.ts
  supabase/functions/create-portal-session/index.ts
  supabase/functions/delete-account/index.ts
  supabase/functions/generate-data-export/index.ts
  supabase/functions/get-document-signed-url/index.ts
  supabase/functions/get-ledger-entry/index.ts
  supabase/functions/get-onboarding-context/index.ts
  supabase/functions/get-onboarding-sync-payload/index.ts
  supabase/functions/get-project-view/index.ts
  supabase/functions/photo-to-scope/index.ts
  supabase/functions/process-document-queue/index.ts
  supabase/functions/revenuecat-webhook/index.ts
  supabase/functions/send-email/index.ts
  supabase/functions/stripe-webhook/index.ts
  supabase/functions/submit-marketing-lead/index.ts
  supabase/functions/upload-document/index.ts
  supabase/functions/upload-gallery-photo/index.ts
)

for f in "${FILES[@]}"; do
  echo "deno check $f"
  "${DENO_BIN[@]}" check --config "$CONFIG" "$f"
done

echo "deno test supabase/functions/_shared/*.test.ts"
"${DENO_BIN[@]}" test --allow-all --config "$CONFIG" \
  "$ROOT/supabase/functions/_shared/auth.test.ts" \
  "$ROOT/supabase/functions/_shared/versioning.test.ts" \
  "$ROOT/supabase/functions/_shared/gemini-circuit-breaker.test.ts"
