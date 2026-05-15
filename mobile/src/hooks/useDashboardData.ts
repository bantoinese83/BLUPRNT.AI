import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardDataShared } from "@shared/hooks/use-dashboard-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { dashboardQueryKey } from "@/lib/query-client";
import {
  buildMobileDashboardAdapter,
  useMobileDashboardDataInjected,
} from "./build-mobile-dashboard-adapter";

import { useMobileDashboardProjectRealtime } from "./useMobileDashboardProjectRealtime";

import {
  addScopeItem as sharedAddScopeItem,
  recalcProjectTotals as sharedRecalcProjectTotals,
  type NewScopeItem,
} from "@shared/lib/scope-operations";

export function useDashboardData() {
  const client = useQueryClient();
  const mobileInjected = useMobileDashboardDataInjected();
  const adapter = useMemo(
    () => buildMobileDashboardAdapter(mobileInjected),
    [mobileInjected],
  );
  const shared = useDashboardDataShared(adapter);

  useMobileDashboardProjectRealtime(shared.project?.id ?? null);

  const configurationMissing = !isSupabaseConfigured();

  const recalcProjectTotals = useCallback(async (pid: string) => {
    await sharedRecalcProjectTotals(supabase, pid);
  }, []);

  const addItem = useCallback(
    async (pid: string, newItem: NewScopeItem) => {
      await sharedAddScopeItem(supabase, pid, newItem);
      void client.invalidateQueries({ queryKey: dashboardQueryKey });
    },
    [client],
  );

  return useMemo(() => {
    const { activeProjectId: _unused1, data: _unused2, ...publicCore } = shared;
    void _unused1;
    void _unused2;
    return {
      ...publicCore,
      configurationMissing,
      addItem,
      recalcProjectTotals,
    };
  }, [shared, configurationMissing, addItem, recalcProjectTotals]);
}
