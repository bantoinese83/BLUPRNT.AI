import { useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import { IOS_APP_STORE_URL } from "@shared/constants/app-links";

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
        const minVersion =
          typeof row.value === "string" ? row.value : String(row.value ?? "");
        if (!minVersion) {
          setIsChecking(false);
          return;
        }

        // Simple semver comparison (major.minor.patch)
        if (compareVersions(currentVersion, minVersion) < 0) {
          setIsOutdated(true);
          showUpdateAlert();
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

/**
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

function showUpdateAlert() {
  Alert.alert(
    "Update Required",
    "A new version of BlueprintAI is available. Please update to continue using the app.",
    [
      {
        text: "Update Now",
        onPress: () => {
          const url =
            Platform.OS === "ios"
              ? IOS_APP_STORE_URL
              : "https://play.google.com/store/apps/details?id=ai.bluprnt.mobile";
          void Linking.openURL(url);
        },
      },
    ],
    { cancelable: false },
  );
}
