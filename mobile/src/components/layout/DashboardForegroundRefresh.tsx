import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import Purchases from "react-native-purchases";
import { dashboardQueryKey } from "@/lib/query-client";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * One listener for the whole app: when returning from background, refresh the
 * mobile dashboard snapshot (subscription, passes, ledger, etc.).
 */
export function DashboardForegroundRefresh() {
  const client = useQueryClient();
  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      if (next !== "active") return;
      if (isSupabaseConfigured()) {
        void client.invalidateQueries({ queryKey: dashboardQueryKey });
      }
      void Purchases.getCustomerInfo().catch(() => {
        /* RC not configured (e.g. dev) — ignore */
      });
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => sub.remove();
  }, [client]);
  return null;
}
