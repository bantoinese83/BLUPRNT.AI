#!/usr/bin/env bash
# Run Maestro smoke against a device or simulator with the app already installed.
# Install Maestro: https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLOW="$ROOT/mobile/maestro/app-smoke.yaml"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found."
  echo "Install: https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli"
  echo "Then install the app on a simulator (bundle id ai.bluprnt.mobile), e.g. npx expo run:ios from mobile/, and run this script again."
  exit 1
fi

exec maestro test "$FLOW"
