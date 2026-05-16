import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  const hasLoadedRef = useRef(false);
  const onErrorRef = useRef(onError);
  const signedUrlsRef = useRef(signedUrls);

  onErrorRef.current = onError;
  signedUrlsRef.current = signedUrls;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    hasLoadedRef.current = false;
    setAssets([]);
    setSignedUrls({});
    setError(null);
    setRefreshing(false);
    setLoading(!skipFetch);
  }, [projectId, skipFetch]);

  const fetchAssets = useCallback(
    async (opts?: { silent?: boolean }) => {
      const isInitial = !hasLoadedRef.current;
      if (opts?.silent || !isInitial) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
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
          hasLoadedRef.current = true;
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load assets";
        if (isMounted.current) {
          setError(msg);
        }
        onErrorRef.current?.(err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [projectId, supabase],
  );

  const assetStoragePathsKey = useMemo(
    () =>
      assets
        .map((a) => a.storage_path)
        .filter((path): path is string => !!path)
        .join("\0"),
    [assets],
  );

  const fetchSignedUrls = useCallback(async () => {
    const pathsToFetch = assets
      .map((a) => a.storage_path)
      .filter((path): path is string => !!path && !signedUrlsRef.current[path]);

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
  }, [assets, supabase]);

  useEffect(() => {
    if (!skipFetch) {
      void fetchAssets();
    }
  }, [fetchAssets, skipFetch]);

  useEffect(() => {
    if (!skipFetch && assetStoragePathsKey) {
      void fetchSignedUrls();
    }
  }, [assetStoragePathsKey, fetchSignedUrls, skipFetch]);

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
        onErrorRef.current?.(err);
        return { error: err };
      }
    },
    [supabase, fetchAssets],
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
        onErrorRef.current?.(err);
        return { error: err };
      }
    },
    [projectId, supabase, fetchAssets],
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
