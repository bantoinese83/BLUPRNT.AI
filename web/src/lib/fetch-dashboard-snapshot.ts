import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import type { DashboardSnapshot } from "@shared/types/dashboard-snapshot";
import {
  emptyDashboardSnapshot,
  buildDashboardDataForProject,
  fetchDashboardProjectsList,
  fetchLastActiveProjectIdFromPreferences,
} from "@shared/lib/dashboard-snapshot-core";
import { dashboardSnapshotQueryKey } from "@shared/lib/dashboard-query-key";

export type { DashboardSnapshot };

/**
 * Loads dashboard data from Supabase. Pure data fetcher designed to be wrapped
 * by TanStack Query. Side effects (redirects, local storage updates) should be
 * handled in the calling hook.
 */
export async function fetchDashboardSnapshot(options?: {
  currentPath?: string;
  projectId?: string | null;
}): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) {
    return { ...emptyDashboardSnapshot(), configured: false };
  }

  const path =
    options?.currentPath ??
    `${typeof window !== "undefined" ? window.location.pathname : "/dashboard"}${typeof window !== "undefined" ? window.location.search : ""}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      ...emptyDashboardSnapshot(),
      redirectToLogin: getSafeRedirect(path, "/dashboard"),
    };
  }

  const userId = session.user.id;
  let projectId = options?.projectId ?? null;

  if (!projectId) {
    projectId = await fetchLastActiveProjectIdFromPreferences(supabase, userId);
  }

  const { rows, error: projError } = await fetchDashboardProjectsList(
    supabase,
    userId,
  );
  if (projError) {
    return {
      ...emptyDashboardSnapshot(),
      loadError: friendlyDashboardLoadError(projError),
    };
  }

  if (rows.length > 0) {
    if (!projectId || !rows.find((p) => p.id === projectId)) {
      projectId = rows[0].id;
    }

    const built = await buildDashboardDataForProject(supabase, {
      userId,
      projectId: projectId!,
      allProjects: rows,
      partialMessageVariant: "web",
    });

    return {
      configured: true,
      redirectToLogin: null,
      loadError: built.loadError,
      projects: rows,
      project: built.project,
      scopeItems: built.scopeItems,
      invoices: built.invoices,
      spendByCategory: built.spendByCategory,
      isArchitect: built.isArchitect,
      subscription: built.subscription,
      hasProjectPass: built.hasProjectPass,
      lastProjectId: built.lastProjectId,
    };
  }

  return {
    ...emptyDashboardSnapshot(),
    projects: rows,
    project: null,
    lastProjectId: null,
  };
}

export const dashboardQueryKey = dashboardSnapshotQueryKey;
