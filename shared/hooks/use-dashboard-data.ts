import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardSnapshot } from "../types/dashboard-snapshot";
import { persistLastActiveProjectId } from "../lib/persist-last-active-project-id";
import { useDashboardSnapshotCache } from "./use-dashboard-snapshot-cache";
import { deriveDashboardQueryStatus } from "./derive-dashboard-query-status";
import { deriveHomeTeam } from "../lib/home-team";
import { calculateResaleImpact } from "../lib/resale-value";

/**
 * Injected platform behavior for `useDashboardDataShared` (one implementation, web + mobile).
 * Stabilize with `useMemo` in the app (see web/mobile wrappers).
 */
export type UseDashboardDataAdapter = {
  reportClientError: (key: string, err: unknown) => void;
  isSupabaseConfigured: () => boolean;
  getSupabase: () => SupabaseClient;

  useProjectIdState: () => readonly [
    string | null,
    (id: string | null) => void,
  ];

  getSnapshotQueryKey: (activeProjectId: string | null) => QueryKey;
  fetchSnapshot: (args: {
    activeProjectId: string | null;
  }) => Promise<DashboardSnapshot>;

  /**
   * Always provided so hook order is identical (web: staleTime + keepPreviousData; mobile: {}).
   */
  useQueryOptions: () => {
    staleTime?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    placeholderData?: any;
  };

  shouldSyncFirstResolvedProject: boolean;
  onFirstResolvedProjectId?: (projectId: string) => void;

  setStoredProjectId: (id: string) => void | Promise<void>;

  invalidate: {
    onLoad: (args: {
      activeProjectId: string | null;
      overrideId?: string;
    }) => QueryKey;
    onSelectProject: (projectId: string) => QueryKey;
  };
};

/**
 * Core dashboard data hook. Compose with small platform hooks
 * (e.g. web: login redirect + Realtime) in `web/src/hooks/useDashboardData.ts`.
 */
export function useDashboardDataShared(adapter: UseDashboardDataAdapter) {
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectId] = adapter.useProjectIdState();

  const getSnapshotKey = useCallback(
    () => adapter.getSnapshotQueryKey(activeProjectId),
    [activeProjectId, adapter],
  );

  const {
    clearLoadError,
    setProjects,
    setProject,
    setScopeItems,
    setInvoices,
    setGalleryItems,
  } = useDashboardSnapshotCache(getSnapshotKey, {
    onLocalProjectIdChange: (id) => {
      setActiveProjectId(id);
    },
  });

  const queryOptions = adapter.useQueryOptions();
  const query = useQuery({
    queryKey: adapter.getSnapshotQueryKey(activeProjectId),
    queryFn: () => adapter.fetchSnapshot({ activeProjectId }),
    enabled: adapter.isSupabaseConfigured(),
    retry: 2,
    ...queryOptions,
  });

  const data = query.data;
  const snapshot: DashboardSnapshot | undefined = data;

  useEffect(() => {
    if (!adapter.shouldSyncFirstResolvedProject) return;
    if (!data?.project?.id || activeProjectId) return;
    setActiveProjectId(data.project.id);
    adapter.onFirstResolvedProjectId?.(data.project.id);
  }, [data?.project?.id, activeProjectId, adapter, setActiveProjectId]);

  const load = useCallback(
    async (overrideId?: string) => {
      await queryClient.invalidateQueries({
        queryKey: adapter.invalidate.onLoad({
          activeProjectId,
          overrideId,
        }),
      });
    },
    [queryClient, activeProjectId, adapter],
  );

  const handleProjectSelect = useCallback(
    async (id: string) => {
      await Promise.resolve(adapter.setStoredProjectId(id));
      setActiveProjectId(id);

      const supabase = adapter.getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { error: prefErr } = await persistLastActiveProjectId(
          supabase,
          session.user.id,
          id,
        );
        if (prefErr) {
          adapter.reportClientError(
            "dashboard_last_project_preference",
            prefErr,
          );
        }
      }
      void queryClient.invalidateQueries({
        queryKey: adapter.invalidate.onSelectProject(id),
      });
    },
    [adapter, queryClient, setActiveProjectId],
  );

  const { loading, refreshing } = deriveDashboardQueryStatus(
    query,
    snapshot,
    adapter.isSupabaseConfigured(),
  );

  const homeTeam = useMemo(
    () => deriveHomeTeam(snapshot?.invoices ?? []),
    [snapshot?.invoices],
  );

  const investmentTotal = useMemo(
    () =>
      (snapshot?.invoices ?? []).reduce(
        (acc, inv) => acc + (inv.total ?? 0),
        0,
      ),
    [snapshot?.invoices],
  );

  const resaleImpact = useMemo(
    () => calculateResaleImpact(investmentTotal),
    [investmentTotal],
  );

  return useMemo(
    () => ({
      activeProjectId,
      data,
      loading,
      refreshing,
      loadError: snapshot?.loadError ?? null,
      clearLoadError,
      projects: snapshot?.projects ?? [],
      project: snapshot?.project ?? null,
      scopeItems: snapshot?.scopeItems ?? [],
      invoices: snapshot?.invoices ?? [],
      spendByCategory: snapshot?.spendByCategory ?? {},
      reconciliation: snapshot?.reconciliation ?? null,
      isArchitect: snapshot?.isArchitect ?? false,
      subscription: snapshot?.subscription ?? null,
      hasProjectPass: snapshot?.hasProjectPass ?? false,
      galleryItems: snapshot?.galleryItems ?? [],
      homeTeam,
      investmentTotal,
      resaleImpact,
      load,
      handleProjectSelect,
      setProjects,
      setProject,
      setScopeItems,
      setInvoices,
      setGalleryItems,
    }),
    [
      activeProjectId,
      data,
      loading,
      refreshing,
      snapshot,
      clearLoadError,
      homeTeam,
      investmentTotal,
      resaleImpact,
      load,
      handleProjectSelect,
      setProjects,
      setProject,
      setScopeItems,
      setInvoices,
      setGalleryItems,
    ],
  );
}
