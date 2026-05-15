#!/usr/bin/env bash
# Monthly disaster-recovery drill: restore a remote backup into local Supabase.
# Requires: supabase CLI, Docker, project link (supabase link).
#
# Usage:
#   ./scripts/db-restore-drill.sh
#
# Document actual RTO/RPO from the run in your ops runbook.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Stopping any local stack..."
supabase stop 2>/dev/null || true

echo "==> Starting fresh local stack..."
supabase start

echo "==> Pull latest schema from linked remote (optional sanity)..."
if supabase db pull --help &>/dev/null; then
  echo "    (Run 'supabase db pull' manually if you need schema parity before restore.)"
fi

echo ""
echo "Restore drill checklist:"
echo "  1. In Supabase Dashboard → Database → Backups, note latest backup timestamp."
echo "  2. Use Dashboard 'Restore' to a NEW preview branch OR follow:"
echo "     https://supabase.com/docs/guides/platform/backups"
echo "  3. Point a staging app at the restored instance and smoke-test login + one project."
echo "  4. Record elapsed time and any blockers in your runbook."
echo ""
echo "Local stack is up at: $(supabase status -o env 2>/dev/null | grep API_URL || echo 'supabase status')"
