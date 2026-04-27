import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryRow,
  GalleryItemRow,
} from "../types/database";
import type { DashboardSnapshot } from "../types/dashboard-snapshot";
import { applyDashboardSnapshotPatch } from "../lib/apply-dashboard-snapshot-patch";

export type DashboardSnapshotCacheOptions = {
  /**
   * Web: call when optimistic `setProject` sets a project id (sync `activeProjectId` / localStorage).
   */
  onLocalProjectIdChange?: (projectId: string) => void;
};

/**
 * TanStack cache updates for a dashboard snapshot — shared by web and mobile.
 * Pass a stable `getQueryKey` (e.g. `useCallback(() => key, [deps])`).
 */
export function useDashboardSnapshotCache(
  getQueryKey: () => readonly unknown[],
  options?: DashboardSnapshotCacheOptions,
) {
  const queryClient = useQueryClient();
  const { onLocalProjectIdChange } = options ?? {};

  const clearLoadError = useCallback(() => {
    queryClient.setQueryData<DashboardSnapshot>(getQueryKey(), (prev) =>
      prev ? { ...prev, loadError: null } : prev,
    );
  }, [getQueryKey, queryClient]);

  const setProjects = useCallback(
    (projects: ProjectRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(getQueryKey(), (prev) =>
        applyDashboardSnapshotPatch(prev, { projects }),
      );
    },
    [getQueryKey, queryClient],
  );

  const setProject = useCallback(
    (project: ProjectRow | null) => {
      queryClient.setQueryData<DashboardSnapshot>(getQueryKey(), (prev) =>
        applyDashboardSnapshotPatch(prev, {
          project,
          lastProjectId: project?.id ?? prev?.lastProjectId ?? null,
        }),
      );
      if (project?.id) {
        onLocalProjectIdChange?.(project.id);
      }
    },
    [getQueryKey, onLocalProjectIdChange, queryClient],
  );

  const setScopeItems = useCallback(
    (scopeItems: ScopeRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(getQueryKey(), (prev) =>
        applyDashboardSnapshotPatch(prev, { scopeItems }),
      );
    },
    [getQueryKey, queryClient],
  );

  const setLedgerEntries = useCallback(
    (ledgerEntries: LedgerEntryRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(getQueryKey(), (prev) =>
        applyDashboardSnapshotPatch(prev, { ledgerEntries }),
      );
    },
    [getQueryKey, queryClient],
  );

  const setGalleryItems = useCallback(
    (galleryItems: GalleryItemRow[]) => {
      queryClient.setQueryData<DashboardSnapshot>(getQueryKey(), (prev) =>
        applyDashboardSnapshotPatch(prev, { galleryItems }),
      );
    },
    [getQueryKey, queryClient],
  );

  return {
    clearLoadError,
    setProjects,
    setProject,
    setScopeItems,
    setLedgerEntries,
    setGalleryItems,
  };
}
