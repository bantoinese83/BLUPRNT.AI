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

  const { activeProjectId, data, ...publicCore } = shared;
  void activeProjectId;
  void data;

  return useMemo(
    () => ({
      ...publicCore,
      configurationMissing,
      addItem,
      recalcProjectTotals,
      ledgerEntries: publicCore.ledgerEntries,
      galleryItems: publicCore.galleryItems,
    }),
    [publicCore, configurationMissing, addItem, recalcProjectTotals],
  );
}
