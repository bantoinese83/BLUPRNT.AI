import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import type { DashboardSnapshot } from "@shared/types/dashboard-snapshot";
import {
  emptyDashboardSnapshot,
  buildDashboardDataForProject,
  fetchDashboardProjectsList,
  fetchLastActiveProjectIdFromPreferences,
  fetchProjectSwitcherHints,
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

  let {
    data: { session },
  } = sessionRes;

  // Session Resilience: Occasionally session might not be fully initialized in the client
  if (!session) {
    for (let sAttempt = 1; sAttempt <= 2; sAttempt++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const secondRes = await supabase.auth.getSession();
      if (secondRes.data.session) {
        session = secondRes.data.session;
        break;
      }
    }
  }

  if (!session) {
    return {
      ...emptyDashboardSnapshot(),
      redirectToLogin: getSafeRedirect(path, "/dashboard"),
    };
  }

  const userId = session.user.id;
  const storedProjectId =
    typeof window !== "undefined"
      ? localStorage.getItem("bluprnt_project_id")
      : null;

  // We can fetch the preferences and the project list in parallel.
  const [prefProjectId, projListRes] = await Promise.all([
    options?.projectId
      ? Promise.resolve(options.projectId)
      : fetchLastActiveProjectIdFromPreferences(supabase, userId),
    fetchDashboardProjectsList(supabase, userId),
  ]);

  let projectId = options?.projectId ?? prefProjectId ?? storedProjectId;
  let { rows, error: projError } = projListRes;

  // Resilience: If we have a session but the project list came back empty,
  // check if we have a hint from localStorage (e.g. just signed up).
  // If we have a hint OR we expect one, wait and retry.
  if (!projError && rows.length === 0 && (projectId || storedProjectId)) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      console.warn(
        `[fetchDashboardSnapshot] Project list empty but hint exists. Retry ${attempt}/4...`,
      );
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      const retryRes = await fetchDashboardProjectsList(supabase, userId);
      rows = retryRes.rows;
      projError = retryRes.error;
      if (projError || rows.length > 0) break;
    }
  }

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

    const hintsPromise = fetchProjectSwitcherHints(supabase, rows);

    const [built, projectSwitcherHints] = await Promise.all([
      buildDashboardDataForProject(supabase, {
        userId,
        projectId: projectId!,
        allProjects: rows,
        partialMessageVariant: "web",
      }),
      hintsPromise,
    ]);

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
      projectSwitcherHints,
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
