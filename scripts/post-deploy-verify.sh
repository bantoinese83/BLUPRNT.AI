#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-https://bluprntai.com}"
FUNCTIONS_URL="${FUNCTIONS_URL:-https://elucgaegaihkklnfoasm.supabase.co/functions/v1}"

echo "Checking landing page..."
curl -fsS "$APP_URL" >/dev/null

echo "Checking public project-view function method handling..."
curl -fsS -o /dev/null -w "%{http_code}" "$FUNCTIONS_URL/get-project-view" | {
  read -r code
  if [[ "$code" != "400" && "$code" != "404" ]]; then
    echo "Unexpected status from get-project-view: $code"
    exit 1
  fi
}

echo "Smoke verification passed."
