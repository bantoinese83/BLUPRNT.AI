import { useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import Purchases from "react-native-purchases";
import type { PurchasesPackage } from "react-native-purchases";
import {
  PURCHASE_FAILED_GENERIC,
  PURCHASE_PACKAGE_MISSING,
  PURCHASE_RESTORE_FAILED,
  PURCHASE_RESTORE_NONE,
} from "@/lib/purchase-messages";
import { findUpgradePackage } from "@/lib/revenuecat-packages";
import { queryClient, dashboardQueryKey } from "@/lib/query-client";

type UpgradeActionsPremium = {
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  packages: PurchasesPackage[];
  restore: () => Promise<"ok" | "not_found" | "error">;
  projectId?: string;
};

export function useUpgradeActions(
  onClose: () => void,
  premium: UpgradeActionsPremium,
) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { purchase, packages, restore, projectId } = premium;

  const handlePurchase = useCallback(
    async (selectedPlan: "monthly" | "projectPass") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsPurchasing(true);
      try {
        if (selectedPlan === "projectPass") {
          if (!projectId?.trim()) {
            Alert.alert(
              "Open a project first",
              "Project Pass unlocks the project you’re working on. Go back to your dashboard, open a project, then try again.",
              [{ text: "OK" }],
            );
            return;
          }
          try {
            await Purchases.setAttributes({ project_id: projectId.trim() });
          } catch (e) {
            console.warn("[revenuecat] setAttributes(project_id) failed:", e);
          }
        }

        const pkg = findUpgradePackage(packages, selectedPlan);

        if (pkg) {
          const success = await purchase(pkg);
          if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
            onClose();
          }
        } else {
          Alert.alert("Plan unavailable", PURCHASE_PACKAGE_MISSING, [
            { text: "OK" },
          ]);
        }
      } catch {
        Alert.alert("Purchase didn’t go through", PURCHASE_FAILED_GENERIC, [
          { text: "OK" },
        ]);
      } finally {
        setIsPurchasing(false);
      }
    },
    [packages, purchase, onClose, projectId],
  );

  const handleRestore = useCallback(async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const result = await restore();
      if (result === "ok") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
        onClose();
        return;
      }
      if (result === "not_found") {
        Alert.alert("No purchase found", PURCHASE_RESTORE_NONE, [
          { text: "OK" },
        ]);
        return;
      }
      Alert.alert("Couldn’t restore", PURCHASE_RESTORE_FAILED, [
        { text: "OK" },
      ]);
    } finally {
      setIsRestoring(false);
    }
  }, [restore, onClose, isRestoring]);

  return {
    isPurchasing,
    isRestoring,
    handlePurchase,
    handleRestore,
  };
}
