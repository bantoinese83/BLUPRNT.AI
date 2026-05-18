import { isArchitectPlanEffective } from "./architect-entitlement.ts";
import {
  countBillOrReceiptUploadsInProject,
  FREE_TIER_BILL_RECEIPT_LIMIT,
} from "./ledger-entry-quota.ts";
import type { UserSubscriptionRow } from "../types/database.ts";

/** Global Architect bill/receipt cap per billing period — sync with edge entitlements. */
export const ARCHITECT_MONTHLY_UPLOAD_CAP = 10;

export type LedgerUploadBlockReason = "free_project" | "architect_month" | null;

type SubscriptionFields = Pick<
  UserSubscriptionRow,
  | "status"
  | "current_period_end"
  | "revenuecat_entitlement_active"
  | "ledger_uploads_count"
>;

/**
 * Client-side pre-check before opening the document picker.
 * Server enforcement remains authoritative; this avoids wasted uploads and surfaces the paywall early.
 */
export function getLedgerUploadBlockReason(
  entries: { document_type?: string | null }[],
  options: {
    isArchitect: boolean;
    hasProjectPass: boolean;
    revenueCatPro?: boolean;
    subscription?: SubscriptionFields | null;
  },
): LedgerUploadBlockReason {
  const {
    isArchitect,
    hasProjectPass,
    revenueCatPro = false,
    subscription,
  } = options;

  if (hasProjectPass) return null;

  const architectActive =
    isArchitect ||
    revenueCatPro ||
    isArchitectPlanEffective(subscription ?? undefined);

  if (architectActive) {
    const uploads = subscription?.ledger_uploads_count ?? 0;
    if (uploads >= ARCHITECT_MONTHLY_UPLOAD_CAP) return "architect_month";
    return null;
  }

  if (
    countBillOrReceiptUploadsInProject(entries) >= FREE_TIER_BILL_RECEIPT_LIMIT
  ) {
    return "free_project";
  }

  return null;
}

export function isLedgerUploadBlockedOnClient(
  entries: { document_type?: string | null }[],
  options: Parameters<typeof getLedgerUploadBlockReason>[1],
): boolean {
  return getLedgerUploadBlockReason(entries, options) !== null;
}
