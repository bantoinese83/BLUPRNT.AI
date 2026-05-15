import { useState, useEffect, useCallback, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PhysicalAssetRow } from "../types/database.ts";
import { STORAGE_CONFIG } from "../constants/storage.ts";

export interface UsePhysicalAssetsOptions {
  projectId: string;
  supabase: SupabaseClient;
  onError?: (error: unknown) => void;
  /**
   * If true, the hook will not trigger an initial fetch of assets.
   * Useful when only using the hook for mutation methods (save/delete).
   */
  skipFetch?: boolean;
}

export function usePhysicalAssets({
  projectId,
  supabase,
  onError,
  skipFetch = false,
}: UsePhysicalAssetsOptions) {
  const [assets, setAssets] = useState<PhysicalAssetRow[]>([]);
  const [loading, setLoading] = useState(!skipFetch);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchAssets = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const { data, error: dbError } = await supabase
          .from("physical_assets")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;
        if (isMounted.current) {
          setAssets(data || []);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load assets";
        if (isMounted.current) {
          setError(msg);
        }
        onError?.(err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [projectId, supabase, onError],
  );

  const fetchSignedUrls = useCallback(async () => {
    const pathsToFetch = assets
      .map((a) => a.storage_path)
      .filter((path): path is string => !!path && !signedUrls[path]);

    if (pathsToFetch.length === 0) return;

    try {
      const { data, error } = await supabase.storage
        .from("project-photos")
        .createSignedUrls(pathsToFetch, STORAGE_CONFIG.SIGNED_URL_EXPIRY);

      if (error) throw error;

      if (data && isMounted.current) {
        setSignedUrls((current) => {
          const newUrls = { ...current };
          data.forEach((item) => {
            if (item.signedUrl && item.path) {
              newUrls[item.path] = item.signedUrl;
            }
          });
          return newUrls;
        });
      }
    } catch (err) {
      console.error("[usePhysicalAssets] Error fetching signed URLs:", err);
    }
  }, [assets, signedUrls, supabase]);

  useEffect(() => {
    if (!skipFetch) {
      fetchAssets();
    }
  }, [fetchAssets, skipFetch]);

  useEffect(() => {
    if (!skipFetch) {
      fetchSignedUrls();
    }
  }, [fetchSignedUrls, skipFetch]);

  const deleteAsset = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase
          .from("physical_assets")
          .delete()
          .eq("id", id);
        if (error) throw error;
        await fetchAssets({ silent: true });
        return { error: null };
      } catch (err) {
        onError?.(err);
        return { error: err };
      }
    },
    [supabase, fetchAssets, onError],
  );

  const saveAsset = useCallback(
    async (
      formData: Omit<
        PhysicalAssetRow,
        "id" | "project_id" | "created_at" | "updated_at"
      >,
    ) => {
      try {
        const { error } = await supabase.from("physical_assets").insert({
          project_id: projectId,
          ...formData,
        });
        if (error) throw error;
        await fetchAssets({ silent: true });
        return { error: null };
      } catch (err) {
        onError?.(err);
        return { error: err };
      }
    },
    [projectId, supabase, fetchAssets, onError],
  );

  return {
    assets,
    loading,
    refreshing,
    error,
    signedUrls,
    refresh: fetchAssets,
    deleteAsset,
    saveAsset,
  };
}
