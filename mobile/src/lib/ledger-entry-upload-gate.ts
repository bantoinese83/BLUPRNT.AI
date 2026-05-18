import { isArchitectQuotaLedgerEntryType } from "@shared/lib/infer-document-type";
import { isLedgerUploadBlockedOnClient } from "@shared/lib/ledger-upload-client-gate";
import type {
  LedgerEntryRow,
  UserSubscriptionRow,
} from "@shared/types/database";

/** Bills & receipts (both count toward the same per-project / Architect cap). */
export function countLedgerEntryDocuments(entries: LedgerEntryRow[]): number {
  return entries.filter((i) =>
    isArchitectQuotaLedgerEntryType(i.document_type ?? "invoice"),
  ).length;
}

/**
 * Free tier allows a small number of ledger records (bills/receipts) per project before upgrade.
 * Returns true when the user must upgrade before adding another ledger-class doc.
 */
export function isFreeTierLedgerEntryLimitReached(
  entries: LedgerEntryRow[],
  isArchitect: boolean,
  hasProjectPass: boolean,
  options?: {
    revenueCatPro?: boolean;
    subscription?: UserSubscriptionRow | null;
  },
): boolean {
  return isLedgerUploadBlockedOnClient(entries, {
    isArchitect,
    hasProjectPass,
    revenueCatPro: options?.revenueCatPro,
    subscription: options?.subscription ?? undefined,
  });
}
