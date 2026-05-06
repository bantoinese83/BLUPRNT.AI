import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GalleryItemRow } from "../types/database";

import { STORAGE_CONFIG } from "../constants/storage";

export type GalleryItem = GalleryItemRow;

export type TransformationSet = {
  before: GalleryItem | null;
  after: GalleryItem | null;
};

export function useTransformationVaultLogic(
  projectId: string,
  galleryItems: GalleryItem[],
  supabase: SupabaseClient,
) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [signedUrlsError, setSignedUrlsError] = useState<string | null>(null);
  const [isResolvingUrls, setIsResolvingUrls] = useState(false);
  const signedUrlsRef = useRef(signedUrls);
  const isMounted = useRef(true);

  signedUrlsRef.current = signedUrls;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Clear cache when switching projects
  useEffect(() => {
    setSignedUrls({});
    setSignedUrlsError(null);
    setIsResolvingUrls(false);
  }, [projectId]);

  // Group items into sets (Optimized single-pass)
  const sets = useMemo(() => {
    const safeGallery = Array.isArray(galleryItems) ? galleryItems : [];
    const befores = [];
    const afters = [];
    for (const item of safeGallery) {
      if (item.photo_type === "before") befores.push(item);
      else if (item.photo_type === "after") afters.push(item);
    }
    const count = Math.max(befores.length, afters.length, 1);

    const result: TransformationSet[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        before: befores[i] || null,
        after: afters[i] || null,
      });
    }

    // Always provide an empty set at the end to allow adding a new one if the last one is full
    const last = result[result.length - 1];
    if (last && (last.before || last.after)) {
      result.push({ before: null, after: null });
    }

    return result;
  }, [galleryItems]);

  const fetchSignedUrls = useCallback(async () => {
    const safeGallery = Array.isArray(galleryItems) ? galleryItems : [];
    const pathsToFetch = safeGallery
      .map((i) => i.storage_path)
      .filter((path) => path && !signedUrlsRef.current[path]);

    if (pathsToFetch.length === 0) {
      setSignedUrlsError(null);
      return;
    }

    setSignedUrlsError(null);
    setIsResolvingUrls(true);

    try {
      const { data, error } = await supabase.storage
        .from("project-photos")
        .createSignedUrls(
          pathsToFetch as string[],
          STORAGE_CONFIG.SIGNED_URL_EXPIRY,
        );

      if (error) {
        console.error(
          "[useTransformationVaultLogic] Error creating signed URLs:",
          error,
        );
        if (isMounted.current) {
          setSignedUrlsError(
            error.message || "Could not load photos from storage.",
          );
        }
        return;
      }

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
    } finally {
      if (isMounted.current) {
        setIsResolvingUrls(false);
      }
    }
  }, [galleryItems, supabase]);

  useEffect(() => {
    void fetchSignedUrls();
  }, [fetchSignedUrls]);

  return {
    sets,
    signedUrls,
    signedUrlsError,
    isResolvingUrls,
    refreshSignedUrls: fetchSignedUrls,
  };
}
