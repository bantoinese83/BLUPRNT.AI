import type { InvoiceRow } from "@shared/types/database";

/** Invoices whose stored type is the default “invoice” document. */
export function countInvoiceDocuments(invoices: InvoiceRow[]): number {
  return invoices.filter((i) => (i.document_type ?? "invoice") === "invoice")
    .length;
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
