#!/usr/bin/env bash
# Run Maestro against a device or simulator with the app already installed.
# Install Maestro: https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Default: single smoke flow (reliable with Expo dev client + Metro).
# Full suite: pass mobile/maestro/ — requires CI or MAESTRO_CLEAR_STATE=true (clears app between flows).
FLOW="${1:-$ROOT/mobile/maestro/app-smoke.yaml}"

sync_launch_template() {
  if [[ -n "${MAESTRO_CLEAR_STATE:-}" ]]; then
    if [[ "$MAESTRO_CLEAR_STATE" == "true" ]]; then
      LAUNCH_MODE=clear
    else
      LAUNCH_MODE=keep
    fi
  elif [[ "${CI:-}" == "true" ]]; then
    LAUNCH_MODE=clear
  else
    LAUNCH_MODE=keep
  fi
  cp "$ROOT/mobile/maestro/common/launch-app-${LAUNCH_MODE}.yaml" "$ROOT/mobile/maestro/common/launch-app.active.yaml"
}

export PATH="$PATH:$HOME/.maestro/bin"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found."
  echo "Install: https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli"
  echo "Then install the app on a simulator (bundle id ai.bluprnt.mobile), e.g. npx expo run:ios from mobile/, and run this script again."
  exit 1
fi

run_single() {
  sync_launch_template
  maestro test "$1"
}

if [[ -d "$FLOW" ]]; then
  if [[ "${CI:-}" != "true" && "${MAESTRO_CLEAR_STATE:-}" != "true" ]]; then
    echo "error: running every flow in $FLOW needs CI or MAESTRO_CLEAR_STATE=true (Maestro parallelizes folder runs; flows assume a fresh app)." >&2
    echo "hint: npm run test:e2e:mobile   # app-smoke only" >&2
    echo "hint: MAESTRO_CLEAR_STATE=true npm run test:e2e:mobile -- mobile/maestro/   # full suite (Release build or reconnect Metro after each)" >&2
    exit 2
  fi
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    base=$(basename "$f")
    case "$base" in
    capture-marketing-screens.yaml)
      echo "[e2e-mobile-maestro] skip $base (manual)"
      continue
      ;;
    auth-login.yaml)
      if [[ -z "${USER_EMAIL:-}" || -z "${USER_PASSWORD:-}" ]]; then
        echo "[e2e-mobile-maestro] skip $base (set USER_EMAIL and USER_PASSWORD)"
        continue
      fi
      ;;
    esac
    echo "[e2e-mobile-maestro] running $base ..."
    run_single "$f" || exit 1
  done < <(find "$FLOW" -maxdepth 1 -name "*.yaml" -type f | LC_ALL=C sort)
else
  run_single "$FLOW"
fi
