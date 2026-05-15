import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import type { DashboardSnapshot } from "@shared/types/dashboard-snapshot";
import type { ProjectRow } from "@shared/types/database";
import { parseCachedDashboardPayload } from "@shared/lib/dashboard-cache-payload";
import {
  emptyDashboardSnapshot,
  buildDashboardDataForProject,
  fetchDashboardProjectsList,
  fetchLastActiveProjectIdFromPreferences,
  fetchProjectSwitcherHints,
} from "@shared/lib/dashboard-snapshot-core";

async function loadStaleDashboardFromCache(
  cacheKey: string,
): Promise<DashboardSnapshot | null> {
  const raw = await AsyncStorage.getItem(cacheKey);
  if (!raw) return null;
  const c = parseCachedDashboardPayload(raw);
  if (!c) return null;
  const lastProjectId =
    c.project?.id ?? (await AsyncStorage.getItem("bluprnt_project_id")) ?? null;

  // reconciliation is now part of the CachedDashboardPayload type
  const recon = c.reconciliation;

  return {
    configured: true,
    redirectToLogin: null,
    loadError: null,
    projects: c.projects,
    project: c.project,
    scopeItems: c.scopeItems,
    ledgerEntries: c.ledgerEntries,
    galleryItems: c.galleryItems || [],
    spendByCategory: c.spendByCategory,
    reconciliation: recon ?? null,
    isArchitect: c.isArchitect,
    subscription: c.subscription,
    hasProjectPass: c.hasProjectPass,
    lastProjectId,
    projectSwitcherHints: c.projectSwitcherHints ?? {},
  };
}

export async function fetchMobileDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) {
    return { ...emptyDashboardSnapshot(), configured: false };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return emptyDashboardSnapshot();
  }

  const userId = session.user.id;
  const cacheKey = `bluprnt_dash_${userId}`;

  let projectId = await AsyncStorage.getItem("bluprnt_project_id");
  const fromPrefs = await fetchLastActiveProjectIdFromPreferences(
    supabase,
    userId,
  );
  if (fromPrefs) {
    projectId = fromPrefs;
  }

  const { rows, error: projError } = await fetchDashboardProjectsList(
    supabase,
    userId,
  );

  if (projError) {
    const stale = await loadStaleDashboardFromCache(cacheKey);
    if (stale) {
      return {
        ...stale,
        loadError: friendlyDashboardLoadError(projError),
      };
    }
    return {
      ...emptyDashboardSnapshot(),
      loadError: friendlyDashboardLoadError(projError),
    };
  }

  if (rows.length > 0) {
    const hintsPromise = fetchProjectSwitcherHints(supabase, rows);

    const firstRow = rows[0]!;
    if (!projectId) {
      projectId = firstRow.id;
      await AsyncStorage.setItem("bluprnt_project_id", projectId as string);
    }

    let project: ProjectRow | null =
      rows.find((p) => p.id === projectId) ?? null;
    if (!project) {
      projectId = firstRow.id;
      project = firstRow;
      await AsyncStorage.setItem("bluprnt_project_id", projectId as string);
    }

    if (!projectId || !project) {
      const projectSwitcherHints = await hintsPromise;
      return {
        ...emptyDashboardSnapshot(),
        projects: rows,
        project: null,
        lastProjectId: null,
        projectSwitcherHints,
      };
    }

    const [built, projectSwitcherHints] = await Promise.all([
      buildDashboardDataForProject(supabase, {
        userId,
        projectId,
        allProjects: rows,
        partialMessageVariant: "mobile",
      }),
      hintsPromise,
    ]);

    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({
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
        projectSwitcherHints,
      }),
    );

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

  await AsyncStorage.removeItem(cacheKey);

  return {
    ...emptyDashboardSnapshot(),
    projects: rows,
    project: null,
    lastProjectId: null,
  };
}
