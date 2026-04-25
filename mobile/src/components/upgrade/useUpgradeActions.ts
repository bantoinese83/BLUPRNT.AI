import { useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { usePremium } from "@/hooks/usePremium";
import {
  PURCHASE_FAILED_GENERIC,
  PURCHASE_PACKAGE_MISSING,
  PURCHASE_RESTORE_FAILED,
  PURCHASE_RESTORE_NONE,
} from "@/lib/purchase-messages";

export function useUpgradeActions(onClose: () => void) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { purchase, packages, restore } = usePremium();

  const handlePurchase = useCallback(
    async (selectedPlan: "monthly" | "projectPass") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsPurchasing(true);
      try {
        const targetIdentifier =
          selectedPlan === "monthly" ? "$rc_monthly" : "$rc_lifetime";
        const pkg = packages.find((p) => p.identifier === targetIdentifier);

        if (pkg) {
          const success = await purchase(pkg);
          if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    [packages, purchase, onClose],
  );

  const handleRestore = useCallback(async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const result = await restore();
      if (result === "ok") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
