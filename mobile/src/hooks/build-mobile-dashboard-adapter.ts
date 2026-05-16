import { useCallback, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { keepPreviousData } from "@tanstack/react-query";
import type { UseDashboardDataAdapter } from "@shared/hooks/use-dashboard-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { dashboardQueryKey } from "@/lib/query-client";
import { fetchMobileDashboardSnapshot } from "@/lib/fetch-dashboard-snapshot";

const MOBILE_DASHBOARD_PROJECT_ID_KEY = "bluprnt_project_id";

/** Injected storage for last project id; swap in tests with an in-memory mock. */
export type MobileDashboardDataInjected = {
  setProjectId: (id: string) => void | Promise<void>;
};

function useMobileDashboardQueryOptions() {
  return useMemo(
    () => ({
      staleTime: 30000,
      /** Avoid Vault/Home tab flashing skeleton while snapshot refetches (real devices). */
      placeholderData: keepPreviousData,
    }),
    [],
  );
}

function useMobileProjectIdStateStub() {
  const [id] = useState<string | null>(null);
  const noop = useCallback((_next: string | null) => {
    // Single global mobile snapshot; optimistic project switches are cache-only
  }, []);
  return [id, noop] as const;
}

/**
 * Build the shared dashboard adapter. Wrap in `useMemo([injected])` in `useDashboardData`.
 */
export function buildMobileDashboardAdapter(
  injected: MobileDashboardDataInjected,
): UseDashboardDataAdapter {
  return {
    reportClientError,
    isSupabaseConfigured,
    getSupabase: () => supabase,
    useProjectIdState: useMobileProjectIdStateStub,
    useQueryOptions: useMobileDashboardQueryOptions,
    getSnapshotQueryKey: (_activeProjectId: string | null) => dashboardQueryKey,
    fetchSnapshot: () => fetchMobileDashboardSnapshot(),
    shouldSyncFirstResolvedProject: false,
    setStoredProjectId: (id) => {
      void Promise.resolve(injected.setProjectId(id));
    },
    invalidate: {
      onLoad: () => dashboardQueryKey,
      onSelectProject: (_id: string) => dashboardQueryKey,
    },
  };
}

/**
 * Default AsyncStorage binding for last project id.
 */
export function useMobileDashboardDataInjected(
  key: string = MOBILE_DASHBOARD_PROJECT_ID_KEY,
): MobileDashboardDataInjected {
  return useMemo((): MobileDashboardDataInjected => {
    return {
      setProjectId: (id) => AsyncStorage.setItem(key, id),
    };
  }, [key]);
}
