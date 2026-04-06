import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { dashboardQueryKey } from "../lib/query-client";
import { fetchMobileDashboardSnapshot } from "../lib/fetch-dashboard-snapshot";
import type { DashboardSnapshot } from "../types/dashboard-snapshot";
import type { ProjectRow, ScopeRow, InvoiceRow } from "../types/database";

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
  const client = useQueryClient();

  const query = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchMobileDashboardSnapshot,
    staleTime: 30_000,
    enabled: isSupabaseConfigured(),
    retry: 1,
  });

  const snapshot = query.data;
  const configurationMissing = !isSupabaseConfigured();

  const clearLoadError = useCallback(() => {
    client.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
      prev ? { ...prev, loadError: null } : prev,
    );
  }, [client]);

  const load = useCallback(async () => {
    await client.invalidateQueries({ queryKey: dashboardQueryKey });
  }, [client]);

  const setProjects = useCallback(
    (projects: ProjectRow[]) => {
      client.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
        applyPatch(prev, { projects }),
      );
    },
    [client],
  );

  const setProject = useCallback(
    (project: ProjectRow | null) => {
      client.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
        applyPatch(prev, {
          project,
          lastProjectId: project?.id ?? prev?.lastProjectId ?? null,
        }),
      );
    },
    [client],
  );

  const setScopeItems = useCallback(
    (scopeItems: ScopeRow[]) => {
      client.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
        applyPatch(prev, { scopeItems }),
      );
    },
    [client],
  );

  const setInvoices = useCallback(
    (invoices: InvoiceRow[]) => {
      client.setQueryData<DashboardSnapshot>(dashboardQueryKey, (prev) =>
        applyPatch(prev, { invoices }),
      );
    },
    [client],
  );

  const handleProjectSelect = useCallback(
    async (id: string) => {
      await AsyncStorage.setItem("bluprnt_project_id", id);
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
      void client.invalidateQueries({ queryKey: dashboardQueryKey });
    },
    [client],
  );

  const recalcProjectTotals = async (pid: string) => {
    await supabase.rpc("recalc_project_totals", { p_id: pid });
  };

  const addItem = async (
    pid: string,
    newItem: {
      category: string;
      description: string;
      phase: string;
      cost: number;
      quantity: number;
      unit: string;
    },
  ) => {
    const { error: err } = await supabase.from("scope_items").insert({
      project_id: pid,
      category: newItem.category,
      description: newItem.description,
      quantity: newItem.quantity,
      unit: newItem.unit,
      finish_tier: "mid",
      unit_cost_min: newItem.cost,
      unit_cost_max: newItem.cost,
      total_cost_min: newItem.cost * newItem.quantity,
      total_cost_max: newItem.cost * newItem.quantity,
      metadata: { phase: newItem.phase, priority: "medium" },
    });

    if (err) throw err;

    await recalcProjectTotals(pid);
    void client.invalidateQueries({ queryKey: dashboardQueryKey });
  };

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
    configurationMissing,
    projects: snapshot?.projects ?? [],
    project: snapshot?.project ?? null,
    scopeItems: snapshot?.scopeItems ?? [],
    invoices: snapshot?.invoices ?? [],
    isArchitect: snapshot?.isArchitect ?? false,
    subscription: snapshot?.subscription ?? null,
    hasProjectPass: snapshot?.hasProjectPass ?? false,
    load,
    handleProjectSelect,
    addItem,
    recalcProjectTotals,
    setProjects,
    setProject,
    setScopeItems,
    setInvoices,
  };
}
