#!/usr/bin/env bash
# Run Lighthouse against a local Vite preview (production build).
# Usage:
#   ./scripts/lighthouse-local.sh           # mobile emulation (default)
#   ./scripts/lighthouse-local.sh desktop   # desktop emulation
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRESET="${1:-mobile}"
# Default to a high port to avoid clashing with a dev `vite preview` on 4173.
PORT="${LIGHTHOUSE_PORT:-4178}"
URL="http://127.0.0.1:${PORT}/"
OUT="$ROOT/web/lighthouse-report"
REPORT_JSON="${OUT}.report.json"

cd "$ROOT"
npm run clean -w web --silent 2>/dev/null || rm -rf "${ROOT}/web/dist"
npm run build -w web --silent

PREVIEW_PID=""
cleanup() {
  if [[ -n "${PREVIEW_PID}" ]] && kill -0 "${PREVIEW_PID}" 2>/dev/null; then
    kill "${PREVIEW_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

( cd "${ROOT}/web" && exec npx vite preview --host 127.0.0.1 --port "${PORT}" ) &
PREVIEW_PID=$!

for _ in $(seq 1 30); do
  if curl -sf -o /dev/null "${URL}"; then
    break
  fi
  sleep 0.5
done

LH_ARGS=(
  "${URL}"
  "--only-categories=performance,accessibility,best-practices,seo"
  "--chrome-flags=--headless=new --disable-gpu --no-sandbox"
  "--output=json"
  "--output=html"
  "--output-path=${OUT}"
  "--quiet"
)

if [[ "${PRESET}" == "desktop" ]]; then
  LH_ARGS+=("--preset=desktop")
fi

rm -f "${OUT}.report.html" "${REPORT_JSON}" 2>/dev/null || true
npx -y lighthouse@12 "${LH_ARGS[@]}"

export REPORT_JSON="${REPORT_JSON}"
node <<'NODE'
const fs = require("fs");
const p = process.env.REPORT_JSON;
if (!p || !fs.existsSync(p)) {
  console.error("Missing report:", p);
  process.exit(1);
}
const r = JSON.parse(fs.readFileSync(p, "utf8"));
const order = ["performance", "accessibility", "best-practices", "seo"];
console.log("\nLighthouse category scores (0–100):\n");
for (const id of order) {
  const c = r.categories[id];
  const score =
    c && typeof c.score === "number" ? Math.round(c.score * 100) : "n/a";
  console.log(`  ${id.padEnd(18)} ${score}`);
}
const a = r.audits;
console.log("\nLab highlights:\n");
if (a["first-contentful-paint"]?.numericValue != null) {
  console.log(
    `  FCP           ${(a["first-contentful-paint"].numericValue / 1000).toFixed(2)}s`,
  );
}
if (a["largest-contentful-paint"]?.numericValue != null) {
  console.log(
    `  LCP           ${(a["largest-contentful-paint"].numericValue / 1000).toFixed(2)}s`,
  );
}
if (a["total-blocking-time"]?.numericValue != null) {
  console.log(`  TBT           ${Math.round(a["total-blocking-time"].numericValue)}ms`);
}
if (a["cumulative-layout-shift"]?.numericValue != null) {
  console.log(`  CLS           ${a["cumulative-layout-shift"].numericValue.toFixed(3)}`);
}
console.log("\nHTML report: web/lighthouse-report.report.html\n");
NODE
