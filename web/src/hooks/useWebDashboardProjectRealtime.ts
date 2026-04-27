import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { dashboardQueryKey } from "@/lib/fetch-dashboard-snapshot";

/**
 * Subscribes to project / invoices / scope changes for the active dashboard project.
 */
export function useWebDashboardProjectRealtime(activeProjectId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!activeProjectId || !isSupabaseConfigured()) return;

    const invalidate = () => {
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKey(activeProjectId),
      });
    };

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
          invalidate();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ledger_entries",
          filter: `project_id=eq.${activeProjectId}`,
        },
        () => {
          console.log("[Realtime] Ledger updated, refreshing...");
          invalidate();
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
          invalidate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeProjectId, queryClient]);
}
