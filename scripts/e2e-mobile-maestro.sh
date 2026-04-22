#!/usr/bin/env bash
# Run Maestro smoke against a device or simulator with the app already installed.
# Install Maestro: https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLOW="${1:-$ROOT/mobile/maestro/}"

# Maestro cannot substitute env vars into boolean clearState. Copy the right template:
# - keep: local Expo dev client keeps cached Metro URL
# - clear: CI Release install / explicit MAESTRO_CLEAR_STATE=true
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

# Add common local install paths to PATH just in case terminal wasn't restarted
export PATH="$PATH:$HOME/.maestro/bin"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found."
  echo "Install: https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli"
  echo "Then install the app on a simulator (bundle id ai.bluprnt.mobile), e.g. npx expo run:ios from mobile/, and run this script again."
  exit 1
fi

exec maestro test "$FLOW"
