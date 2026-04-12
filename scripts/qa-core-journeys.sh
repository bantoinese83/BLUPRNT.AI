#!/usr/bin/env bash
# Runs automated quality gates, then prints a short manual smoke checklist.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Automated: lint, knip, unit tests, web + mobile production builds =="
npm run check

echo ""
echo "== Manual smoke (staging or production; device + browser) =="
cat <<'EOF'
1. Sign in → open a project → upload an invoice (photo and PDF) → confirm review / OCR step if shown.
2. Enable airplane mode during a refresh → offline banner appears; reconnect → data loads again without a stale-only trap.
3. Finance: ledger loads; export or share if your build exposes it.
4. Settings → billing / subscription: no crash; upgrade path still readable.
5. Web: register, forgot-password, privacy, and terms pages load (also covered by Playwright when you run npm run test:e2e).
EOF

echo ""
echo "Done."
