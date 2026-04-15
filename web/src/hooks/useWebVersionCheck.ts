import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  compareSemverParts,
  minSemverFromAppConfigValue,
} from "@shared/lib/semver-compare";

/**
 * Compares `import.meta.env.VITE_APP_VERSION` to `app_config.min_supported_web_version`.
 * Skipped in E2E (`VITE_E2E=1`) and when Supabase is not configured.
 */
export function useWebVersionCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const [isOutdated, setIsOutdated] = useState(false);

  useEffect(() => {
    if (import.meta.env.VITE_E2E === "1") {
      setIsChecking(false);
      return;
    }
    if (!isSupabaseConfigured()) {
      setIsChecking(false);
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const current = import.meta.env.VITE_APP_VERSION?.trim() || "0.0.0";

        const { data, error } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "min_supported_web_version")
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          if (error)
            console.warn(
              "[WebVersionCheck] Failed to fetch min version:",
              error,
            );
          return;
        }

        const minV = minSemverFromAppConfigValue(
          (data as { value: unknown }).value,
        );
        if (!minV) return;

        if (compareSemverParts(current, minV) < 0) {
          setIsOutdated(true);
        }
      } catch (e) {
        console.error("[WebVersionCheck]", e);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isChecking, isOutdated };
}
