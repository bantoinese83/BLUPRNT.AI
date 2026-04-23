import type { DashboardSnapshot } from "../types/dashboard-snapshot";
import { emptyDashboardSnapshot } from "./dashboard-snapshot-core";

/**
 * Used by web + mobile `useDashboardData` for optimistic cache updates.
 */
export function applyDashboardSnapshotPatch(
  prev: DashboardSnapshot | undefined,
  patch: Partial<DashboardSnapshot>,
): DashboardSnapshot {
  if (!prev) {
    return { ...emptyDashboardSnapshot(), ...patch };
  }
  return { ...prev, ...patch };
}
