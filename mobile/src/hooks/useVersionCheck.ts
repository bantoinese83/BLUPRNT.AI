import { useEffect, useState } from "react";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import {
  compareSemverParts,
  minSemverFromAppConfigValue,
} from "@shared/lib/semver-compare";

/**
 * Hook to enforce a minimum required app version.
 * Prevents old binaries from breaking with new backend schemas.
 */
export function useVersionCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const [isOutdated, setIsOutdated] = useState(false);

  useEffect(() => {
    async function checkVersion() {
      try {
        const currentVersion = Constants.expoConfig?.version || "1.0.0";

        // Fetch minimum version from Supabase app_config
        const { data, error } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "min_supported_mobile_version")
          .single();

        if (error || !data) {
          console.warn("[VersionCheck] Failed to fetch min version:", error);
          setIsChecking(false);
          return;
        }

        const row = data as { value: unknown };
        const minVersion = minSemverFromAppConfigValue(row.value);
        if (!minVersion) {
          setIsChecking(false);
          return;
        }

        if (compareSemverParts(currentVersion, minVersion) < 0) {
          setIsOutdated(true);
        }
      } catch (err) {
        console.error("[VersionCheck] Unexpected error:", err);
      } finally {
        setIsChecking(false);
      }
    }

    void checkVersion();
  }, []);

  return { isChecking, isOutdated };
}
