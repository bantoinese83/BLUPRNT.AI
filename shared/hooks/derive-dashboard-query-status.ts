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
    /** First load only — refetches keep prior snapshot via placeholderData. */
    loading: supabaseReady ? query.isPending && !snapshot : false,
    refreshing:
      supabaseReady && !!snapshot && query.isFetching && !query.isPending,
  };
}
