import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { dashboardQueryKey } from "@/lib/query-client";
import { setupProjectDashboardRealtime } from "@shared/lib/realtime-logic";

/**
 * Subscribes to project / ledger / scope changes for the mobile dashboard.
 * Since mobile uses a single global query key, we refresh everything.
 */
export function useMobileDashboardProjectRealtime(
  activeProjectId: string | null,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!activeProjectId || !isSupabaseConfigured()) return;

    let timeout: ReturnType<typeof setTimeout>;

    const channel = setupProjectDashboardRealtime(supabase, {
      projectId: activeProjectId,
      channelPrefix: "mobile_sync",
      onUpdate: ({ table }) => {
        console.log(`[Realtime] ${table} updated, debouncing refresh...`);
        // Use a small debounce and refetchQueries to ensure we bypass replication lag
        // and get the absolute latest state from the database.
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          void queryClient.refetchQueries({
            queryKey: dashboardQueryKey,
            exact: true,
          });
        }, 100);
      },
    });

    return () => {
      clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [activeProjectId, queryClient]);
}
