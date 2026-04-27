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

  const [sessionRes, path] = await Promise.all([
    supabase.auth.getSession(),
    Promise.resolve(
      options?.currentPath ??
        `${typeof window !== "undefined" ? window.location.pathname : "/dashboard"}${typeof window !== "undefined" ? window.location.search : ""}`,
    ),
  ]);

  const {
    data: { session },
  } = sessionRes;

  if (!session) {
    return {
      ...emptyDashboardSnapshot(),
      redirectToLogin: getSafeRedirect(path, "/dashboard"),
    };
  }

  const userId = session.user.id;

  // We can fetch the preferences and the project list in parallel.
  // If options.projectId is provided, we don't need to fetch preferences.
  const [prefProjectId, projListRes] = await Promise.all([
    options?.projectId
      ? Promise.resolve(options.projectId)
      : fetchLastActiveProjectIdFromPreferences(supabase, userId),
    fetchDashboardProjectsList(supabase, userId),
  ]);

  let projectId = options?.projectId ?? prefProjectId;
  const { rows, error: projError } = projListRes;
  if (projError) {
    return {
      ...emptyDashboardSnapshot(),
      loadError: friendlyDashboardLoadError(projError),
    };
  }

  if (rows.length > 0) {
    if (!projectId || !rows.find((p) => p.id === projectId)) {
      projectId = rows[0]!.id;
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
      ledgerEntries: built.ledgerEntries,
      galleryItems: built.galleryItems,
      spendByCategory: built.spendByCategory,
      reconciliation: built.reconciliation,
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
