import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardDataShared } from "@shared/hooks/use-dashboard-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { dashboardQueryKey } from "@/lib/query-client";
import {
  buildMobileDashboardAdapter,
  useMobileDashboardDataInjected,
} from "./build-mobile-dashboard-adapter";

export function useDashboardData() {
  const client = useQueryClient();
  const mobileInjected = useMobileDashboardDataInjected();
  const adapter = useMemo(
    () => buildMobileDashboardAdapter(mobileInjected),
    [mobileInjected],
  );
  const shared = useDashboardDataShared(adapter);

  const configurationMissing = !isSupabaseConfigured();

  const recalcProjectTotals = useCallback(async (pid: string) => {
    await supabase.rpc("recalc_project_totals", { p_id: pid });
  }, []);

  const addItem = useCallback(
    async (
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
        description: newItem.description || "",
        phase: newItem.phase,
        quantity: newItem.quantity,
        unit: newItem.unit,
        finish_tier: "mid",
        unit_cost_min: newItem.cost,
        unit_cost_max: newItem.cost,
        total_cost_min: newItem.cost * newItem.quantity,
        total_cost_max: newItem.cost * newItem.quantity,
      });

      if (err) throw err;

      await recalcProjectTotals(pid);
      void client.invalidateQueries({ queryKey: dashboardQueryKey });
    },
    [client, recalcProjectTotals],
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
      galleryItems: publicCore.galleryItems,
    }),
    [publicCore, configurationMissing, addItem, recalcProjectTotals],
  );
}
