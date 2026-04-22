import React from "react";

import { LaunchLoadingLayout } from "@/components/LaunchLoadingLayout";

/**
 * Shown while Google fonts load at cold start — before Outfit is available.
 * Uses the same light gradient + card treatment as in-app boot states.
 */
export function BrandedSplash() {
  return <LaunchLoadingLayout variant="standalone" status="Almost there…" />;
}
