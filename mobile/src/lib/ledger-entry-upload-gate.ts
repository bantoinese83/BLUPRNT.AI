import { isArchitectQuotaLedgerEntryType } from "@shared/lib/infer-document-type";
import { FREE_TIER_BILL_RECEIPT_LIMIT } from "@shared/lib/ledger-entry-quota";
import type { LedgerEntryRow } from "@shared/types/database";

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
): boolean {
  if (isArchitect || hasProjectPass) return false;
  return countLedgerEntryDocuments(entries) >= FREE_TIER_BILL_RECEIPT_LIMIT;
}
