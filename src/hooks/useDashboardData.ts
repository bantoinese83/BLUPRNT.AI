import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  dashboardQueryKey,
  fetchDashboardSnapshot,
  type DashboardSnapshot,
} from "@/lib/fetch-dashboard-snapshot";
import type { ProjectRow, ScopeRow, InvoiceRow } from "@shared/types/database";

function applyPatch(
  prev: DashboardSnapshot | undefined,
  patch: Partial<DashboardSnapshot>,
): DashboardSnapshot {
  if (!prev) {
    return {
      configured: true,
      redirectToLogin: null,
      loadError: null,
      projects: [],
      project: null,
      scopeItems: [],
      invoices: [],
      isArchitect: false,
      subscription: null,
      hasProjectPass: false,
      lastProjectId: null,
      ...patch,
    };
  }
  return { ...prev, ...patch };
}

export function useDashboardData() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lastRedirect = useRef<string | null>(null);

  const query = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: () =>
      fetchDashboardSnapshot({
        currentPath: `${window.location.pathname}${window.location.search}`,
      }),
    staleTime: 30_000,
    enabled: isSupabaseConfigured(),
    retry: 2,
  });

  const data = query.data;

  useEffect(() => {
    if (!data?.redirectToLogin || !data.configured) {
      lastRedirect.current = null;
      return;
    }
    const target = `/login?redirect=${encodeURIComponent(data.redirectToLogin)}`;
    if (lastRedirect.current === target) return;
    lastRedirect.current = target;
    navigate(target, { replace: true });
  }, [data?.redirectToLogin, data?.configured, navigate]);

  const snapshot: DashboardSnapshot | undefined = data;

  const clearLoadError = useCallback(() => {
    queryClient.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
      prev ? { ...prev, loadError: null } : prev,
    );
  }, [queryClient]);

  const load = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
  }, [queryClient]);

  const setProjects = useCallback(
    (projects: ProjectRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
        applyPatch(prev, { projects }),
      );
    },
    [queryClient],
  );

  const setProject = useCallback(
    (project: ProjectRow | null) => {
      queryClient.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
        applyPatch(prev, {
          project,
          lastProjectId: project?.id ?? prev?.lastProjectId ?? null,
        }),
      );
    },
    [queryClient],
  );

  const setScopeItems = useCallback(
    (scopeItems: ScopeRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
        applyPatch(prev, { scopeItems }),
      );
    },
    [queryClient],
  );

  const setInvoices = useCallback(
    (invoices: InvoiceRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
        applyPatch(prev, { invoices }),
      );
    },
    [queryClient],
  );

  const handleProjectSelect = useCallback(
    async (id: string) => {
      try {
        localStorage.setItem("bluprnt_project_id", id);
      } catch {
        /* ignore */
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("user_preferences").upsert({
          user_id: session.user.id,
          last_active_project_id: id,
          updated_at: new Date().toISOString(),
        });
      }
      void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
    [queryClient],
  );

  const loading = isSupabaseConfigured()
    ? query.isPending || query.isLoading
    : false;
  const refreshing =
    isSupabaseConfigured() &&
    !!snapshot &&
    query.isFetching &&
    !query.isLoading;

  return {
    loading,
    refreshing,
    loadError: snapshot?.loadError ?? null,
    clearLoadError,
    projects: snapshot?.projects ?? [],
    project: snapshot?.project ?? null,
    scopeItems: snapshot?.scopeItems ?? [],
    invoices: snapshot?.invoices ?? [],
    isArchitect: snapshot?.isArchitect ?? false,
    subscription: snapshot?.subscription ?? null,
    hasProjectPass: snapshot?.hasProjectPass ?? false,
    load,
    handleProjectSelect,
    setProjects,
    setProject,
    setScopeItems,
    setInvoices,
  };
}
