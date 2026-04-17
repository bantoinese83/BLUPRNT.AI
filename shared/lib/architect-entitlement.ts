import type { UserSubscriptionRow } from "@shared/types/database";

export type ArchitectEntitlementFields = Pick<
  UserSubscriptionRow,
  "status" | "current_period_end" | "revenuecat_entitlement_active"
>;

/**
 * Stripe row alone indicates Architect access (web billing), ignoring RevenueCat.
 * Aligns with `isArchitectPlanEffective` when the store flag is off: active/trialing
 * and either no period end yet (webhook not fully synced) or period still open.
 */
export function isStripeArchitectSubscriptionEntitled(
  sub: ArchitectEntitlementFields | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!sub) return false;
  const st = sub.status;
  if (st !== "active" && st !== "trialing") return false;
  const pe = sub.current_period_end
    ? new Date(sub.current_period_end)
    : null;
  if (!pe) return true;
  return pe > now;
}

/**
 * Stripe subscription row is in good standing for Architect (web billing).
 * Requires a current period end in the future when present (used for billing-anchor resets).
 */
export function isStripeArchitectUploadPeriodOpen(
  sub: ArchitectEntitlementFields | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!sub) return false;
  const st = sub.status;
  if (st !== "active" && st !== "trialing") return false;
  const pe = sub.current_period_end
    ? new Date(sub.current_period_end)
    : null;
  return Boolean(pe && pe > now);
}

/**
 * Whether the user should receive Architect product access (features, UI).
 * Store entitlement wins independently of Stripe row state; otherwise Stripe
 * active/trialing with a valid period (or missing period — row not fully synced yet).
 */
export function isArchitectPlanEffective(
  sub: ArchitectEntitlementFields | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!sub) return false;
  if (sub.revenuecat_entitlement_active === true) return true;
  return isStripeArchitectSubscriptionEntitled(sub, now);
}

export type ArchitectUploadQuotaFields = ArchitectEntitlementFields &
  Pick<UserSubscriptionRow, "invoice_uploads_count">;

const DEFAULT_ARCHITECT_UPLOAD_CAP = 10;

/** Global Architect invoice upload quota (per product rules) still has capacity. */
export function isArchitectGlobalUploadQuotaAvailable(
  sub: ArchitectUploadQuotaFields | null | undefined,
  now: Date = new Date(),
  maxUploads: number = DEFAULT_ARCHITECT_UPLOAD_CAP,
): boolean {
  if (!sub) return false;
  if ((sub.invoice_uploads_count ?? 0) >= maxUploads) return false;
  if (isStripeArchitectSubscriptionEntitled(sub, now)) return true;
  if (sub.revenuecat_entitlement_active === true) return true;
  return false;
}
