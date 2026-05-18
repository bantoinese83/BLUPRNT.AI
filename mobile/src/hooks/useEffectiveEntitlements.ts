import { useMemo } from "react";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePremium } from "@/hooks/usePremium";

/**
 * Merges Supabase snapshot entitlement with live RevenueCat state so paid
 * features unlock immediately after purchase (before webhook sync).
 */
export function useEffectiveEntitlements() {
  const { isArchitect, hasProjectPass, subscription } = useDashboardData();
  const { isPro: revenueCatPro } = usePremium();

  return useMemo(() => {
    const architectFromSnapshot =
      isArchitect || isArchitectPlanEffective(subscription ?? undefined);
    const isArchitectEffective = architectFromSnapshot || revenueCatPro;
    const isUnlocked = isArchitectEffective || hasProjectPass;

    return {
      isArchitect: isArchitectEffective,
      hasProjectPass,
      isUnlocked,
      subscription,
      revenueCatPro,
    };
  }, [isArchitect, hasProjectPass, subscription, revenueCatPro]);
}
