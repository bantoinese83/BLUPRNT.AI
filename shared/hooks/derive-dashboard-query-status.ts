import type { DashboardSnapshot } from "../types/dashboard-snapshot";

type QueryFlags = {
  isPending: boolean;
  isLoading: boolean;
  isFetching: boolean;
};

/**
 * Consistent loading / pull-to-refresh flags for dashboard snapshot queries.
 */
export function deriveDashboardQueryStatus(
  query: QueryFlags,
  snapshot: DashboardSnapshot | undefined,
  supabaseReady: boolean,
): { loading: boolean; refreshing: boolean } {
  return {
    loading: supabaseReady ? query.isPending || query.isLoading : false,
    refreshing:
      supabaseReady && !!snapshot && query.isFetching && !query.isLoading,
  };
}
