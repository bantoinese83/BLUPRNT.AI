import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { keepPreviousData } from "@tanstack/react-query";
import type { UseDashboardDataAdapter } from "@shared/hooks/use-dashboard-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import {
  dashboardQueryKey,
  fetchDashboardSnapshot,
} from "@/lib/fetch-dashboard-snapshot";

const WEB_DASHBOARD_PROJECT_ID_KEY = "bluprnt_project_id";

/**
 * Injected I/O: current URL for `fetchDashboardSnapshot` + last project id in web storage
 * (usually localStorage; tests can pass their own `get`/`set`).
 */
export type WebDashboardDataInjected = {
  getCurrentPath: () => string;
  getProjectId: () => string | null;
  setProjectId: (id: string) => void;
};

function useWebDashboardQueryOptions() {
  return useMemo(
    () => ({
      staleTime: 30_000,
      placeholderData: keepPreviousData,
      /** Subscription + snapshot after Stripe / external billing tab returns. */
      refetchOnWindowFocus: true,
    }),
    [],
  );
}

/**
 * Build the shared dashboard adapter. Wrap in `useMemo([injected])` at the call site
 * (see `useDashboardData`).
 */
export function buildWebDashboardAdapter(
  injected: WebDashboardDataInjected,
): UseDashboardDataAdapter {
  const { getCurrentPath, getProjectId, setProjectId } = injected;

  return {
    reportClientError,
    isSupabaseConfigured,
    getSupabase: () => supabase,
    useProjectIdState() {
      return useState<string | null>(() => getProjectId());
    },
    useQueryOptions: useWebDashboardQueryOptions,
    getSnapshotQueryKey: (activeProjectId) =>
      dashboardQueryKey(activeProjectId),
    fetchSnapshot: ({ activeProjectId }) =>
      fetchDashboardSnapshot({
        currentPath: getCurrentPath(),
        projectId: activeProjectId,
      }),
    shouldSyncFirstResolvedProject: true,
    onFirstResolvedProjectId: (id) => {
      setProjectId(id);
    },
    setStoredProjectId: (id) => {
      setProjectId(id);
    },
    invalidate: {
      onLoad: ({ activeProjectId, overrideId }) =>
        dashboardQueryKey(overrideId ?? activeProjectId),
      onSelectProject: (id) => dashboardQueryKey(id),
    },
  };
}

/**
 * Binds the router + default localStorage to {@link WebDashboardDataInjected}.
 * `storageKey` supports tests (or multi-tab keys) without forking the builder.
 */
export function useWebDashboardDataInjected(
  storageKey: string = WEB_DASHBOARD_PROJECT_ID_KEY,
): WebDashboardDataInjected {
  const location = useLocation();
  return useMemo((): WebDashboardDataInjected => {
    return {
      getCurrentPath: () => `${location.pathname}${location.search}`,
      getProjectId: () => {
        try {
          return localStorage.getItem(storageKey);
        } catch {
          return null;
        }
      },
      setProjectId: (id) => {
        try {
          localStorage.setItem(storageKey, id);
        } catch {
          /* ignore */
        }
      },
    };
  }, [location.pathname, location.search, storageKey]);
}
