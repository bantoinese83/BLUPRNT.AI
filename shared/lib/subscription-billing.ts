import type { UserSubscriptionRow } from "@shared/types/database";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";

/** User may be paying for Architect on both Stripe (web) and the app store. */
export function hasDuplicateWebAndStoreSubscriptions(
  sub: UserSubscriptionRow | null,
): boolean {
  if (!sub) return false;
  return Boolean(
    sub.stripe_subscription_id && sub.revenuecat_entitlement_active === true,
  );
}

export type ArchitectBillingChannel = "stripe" | "store" | "mixed" | "unknown";

/** Best-effort label for where the active Architect subscription is billed. */
export function architectBillingChannel(
  sub: UserSubscriptionRow | null,
): ArchitectBillingChannel {
  if (!sub || !isArchitectPlanEffective(sub)) return "unknown";
  const stripe = Boolean(sub.stripe_subscription_id);
  const rc = sub.revenuecat_entitlement_active === true;
  if (stripe && rc) return "mixed";
  if (stripe) return "stripe";
  if (rc) return "store";
  return "unknown";
}
