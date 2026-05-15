#!/usr/bin/env bash
# Runs Supabase DB lint when the CLI is linked; otherwise skips with a notice.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v supabase &>/dev/null; then
  echo "supabase CLI not installed — skipping db lint (install for local/CI lint)."
  exit 0
fi

if [[ ! -f "$ROOT/supabase/config.toml" ]]; then
  echo "No supabase/config.toml — skipping db lint."
  exit 0
fi

echo "Running supabase db lint..."
supabase db lint
