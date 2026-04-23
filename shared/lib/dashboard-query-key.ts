/** TanStack Query key for web dashboard snapshot (parametrized by project). */
export const dashboardSnapshotQueryKey = (projectId?: string | null) =>
  ["dashboard", "snapshot", projectId ?? "latest"] as const;
