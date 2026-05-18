import React from "react";

import { LaunchLoadingLayout } from "@/components/LaunchLoadingLayout";

/**
 * Shown while Google fonts load at cold start — before Outfit is available.
 * Uses the same light gradient shell as the rest of the app (no teal native flash).
 */
export function BrandedSplash() {
  return <LaunchLoadingLayout variant="standalone" status="Almost there…" />;
}
