/**
 * Keep in sync with shared/lib/architect-entitlement.ts (Supabase deploy cannot import the monorepo package).
 */

export type ArchitectEntitlementFields = {
  status: string;
  current_period_end: string | null;
  revenuecat_entitlement_active: boolean;
};

export type ArchitectUploadQuotaFields = ArchitectEntitlementFields & {
  invoice_uploads_count?: number | null;
};

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

export function isArchitectPlanEffective(
  sub: ArchitectEntitlementFields | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!sub) return false;
  if (sub.revenuecat_entitlement_active === true) return true;
  return isStripeArchitectSubscriptionEntitled(sub, now);
}

export function isArchitectGlobalUploadQuotaAvailable(
  sub: ArchitectUploadQuotaFields | null | undefined,
  now: Date = new Date(),
  maxUploads: number = 10,
): boolean {
  if (!sub) return false;
  if ((sub.invoice_uploads_count ?? 0) >= maxUploads) return false;
  if (isStripeArchitectSubscriptionEntitled(sub, now)) return true;
  if (sub.revenuecat_entitlement_active === true) return true;
  return false;
}
