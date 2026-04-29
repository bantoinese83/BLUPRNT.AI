import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { dashboardQueryKey } from "@/lib/fetch-dashboard-snapshot";
import { setupProjectDashboardRealtime } from "@shared/lib/realtime-logic";

/**
 * Subscribes to project / invoices / scope changes for the active dashboard project.
 */
export function useWebDashboardProjectRealtime(activeProjectId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!activeProjectId || !isSupabaseConfigured()) return;

    let timeout: ReturnType<typeof setTimeout>;

    const channel = setupProjectDashboardRealtime(supabase, {
      projectId: activeProjectId,
      channelPrefix: "project_sync",
      onUpdate: () => {
        // Use a small debounce and refetchQueries to ensure we bypass replication lag
        // and avoid multiple rapid requests when several tables update at once.
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          void queryClient.refetchQueries({
            queryKey: dashboardQueryKey(activeProjectId),
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
