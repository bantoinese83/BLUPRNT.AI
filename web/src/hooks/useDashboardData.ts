import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
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
      spendByCategory: {},
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

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("bluprnt_project_id");
    } catch {
      return null;
    }
  });

  const query = useQuery({
    queryKey: dashboardQueryKey(activeProjectId),
    queryFn: () =>
      fetchDashboardSnapshot({
        currentPath: `${window.location.pathname}${window.location.search}`,
        projectId: activeProjectId,
      }),
    staleTime: 30_000,
    enabled: isSupabaseConfigured(),
    retry: 2,
  });

  const data = query.data;

  // Sync state with resolved project ID from the first successful load if not set
  useEffect(() => {
    if (data?.project?.id && !activeProjectId) {
      setActiveProjectId(data.project.id);
      try {
        localStorage.setItem("bluprnt_project_id", data.project.id);
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.project?.id]);

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
    queryClient.setQueryData<DashboardSnapshot>(
      dashboardQueryKey(activeProjectId),
      (prev) => (prev ? { ...prev, loadError: null } : prev),
    );
  }, [queryClient, activeProjectId]);

  const load = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKey(activeProjectId),
    });
  }, [queryClient, activeProjectId]);

  const setProjects = useCallback(
    (projects: ProjectRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(
        dashboardQueryKey(activeProjectId),
        (prev) => applyPatch(prev, { projects }),
      );
    },
    [queryClient, activeProjectId],
  );

  const setProject = useCallback(
    (project: ProjectRow | null) => {
      queryClient.setQueryData<DashboardSnapshot>(
        dashboardQueryKey(activeProjectId),
        (prev) =>
          applyPatch(prev, {
            project,
            lastProjectId: project?.id ?? prev?.lastProjectId ?? null,
          }),
      );
      if (project?.id) {
        setActiveProjectId(project.id);
      }
    },
    [queryClient, activeProjectId],
  );

  const setScopeItems = useCallback(
    (scopeItems: ScopeRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(
        dashboardQueryKey(activeProjectId),
        (prev) => applyPatch(prev, { scopeItems }),
      );
    },
    [queryClient, activeProjectId],
  );

  const setInvoices = useCallback(
    (invoices: InvoiceRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(
        dashboardQueryKey(activeProjectId),
        (prev) => applyPatch(prev, { invoices }),
      );
    },
    [queryClient, activeProjectId],
  );

  const handleProjectSelect = useCallback(
    async (id: string) => {
      try {
        localStorage.setItem("bluprnt_project_id", id);
      } catch {
        /* ignore */
      }
      setActiveProjectId(id);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { error: prefErr } = await supabase
          .from("user_preferences")
          .upsert({
            user_id: session.user.id,
            last_active_project_id: id,
            updated_at: new Date().toISOString(),
          });
        if (prefErr) {
          reportClientError("dashboard_last_project_preference", prefErr);
        }
      }
      void queryClient.invalidateQueries({
        queryKey: dashboardQueryKey(id),
      });
    },
    [queryClient],
  );

  // REALTIME SYNC: Subscribe to any changes for the current project
  useEffect(() => {
    if (!activeProjectId || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`project_sync:${activeProjectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `id=eq.${activeProjectId}`,
        },
        () => {
          console.log("[Realtime] Project updated, refreshing...");
          queryClient.invalidateQueries({
            queryKey: dashboardQueryKey(activeProjectId),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `project_id=eq.${activeProjectId}`,
        },
        () => {
          console.log("[Realtime] Invoices updated, refreshing...");
          queryClient.invalidateQueries({
            queryKey: dashboardQueryKey(activeProjectId),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scope_items",
          filter: `project_id=eq.${activeProjectId}`,
        },
        () => {
          console.log("[Realtime] Scope updated, refreshing...");
          queryClient.invalidateQueries({
            queryKey: dashboardQueryKey(activeProjectId),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeProjectId, queryClient]);

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
    spendByCategory: snapshot?.spendByCategory ?? {},
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
