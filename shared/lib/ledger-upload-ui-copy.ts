import {
  ARCHITECT_MONTHLY_UPLOAD_CAP,
  type LedgerUploadBlockReason,
} from "./ledger-upload-client-gate.ts";
import { FREE_TIER_BILL_RECEIPT_LIMIT } from "./ledger-entry-quota.ts";

export type LedgerUploadLimitUiCopy = {
  title: string;
  body: string;
  cta: string;
  quotaHint: string;
};

export function ledgerUploadLimitUiCopy(
  reason: LedgerUploadBlockReason,
): LedgerUploadLimitUiCopy | null {
  if (!reason) return null;

  const quotaHint =
    "Only vendor invoices and store receipts count toward this cap—quotes, estimates, permits, and other records don't.";

  if (reason === "architect_month") {
    return {
      title: "Monthly upload limit reached",
      body: `You've used all ${ARCHITECT_MONTHLY_UPLOAD_CAP} bill or receipt uploads for this billing period. Your quota resets when your subscription renews.`,
      cta: "View plans",
      quotaHint,
    };
  }

  return {
    title: "Free upload limit reached",
    body: `You've used all ${FREE_TIER_BILL_RECEIPT_LIMIT} free bill or receipt uploads on this project. Upgrade to add more anytime.`,
    cta: "See upgrade options",
    quotaHint,
  };
}
