import { isArchitectQuotaInvoiceType } from "@shared/lib/infer-document-type";
import type { InvoiceRow } from "@shared/types/database";

/** Bills & receipts (both count toward the same per-project / Architect cap). */
export function countInvoiceDocuments(invoices: InvoiceRow[]): number {
  return invoices.filter((i) =>
    isArchitectQuotaInvoiceType(i.document_type ?? "invoice"),
  ).length;
}

/**
 * Free tier allows a small number of invoice documents per project before upgrade.
 * Returns true when the user must upgrade before adding another invoice-class doc.
 */
export function isFreeTierInvoiceLimitReached(
  invoices: InvoiceRow[],
  isArchitect: boolean,
  hasProjectPass: boolean,
): boolean {
  if (isArchitect || hasProjectPass) return false;
  return countInvoiceDocuments(invoices) >= 3;
}
