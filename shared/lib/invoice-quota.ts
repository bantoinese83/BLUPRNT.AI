import { isArchitectQuotaInvoiceType } from "./infer-document-type";

/**
 * Free tier: max combined vendor invoice + store receipt uploads per project.
 * (Quotes, estimates, permits, and other record types are unlimited on Free.)
 * Must stay in sync with `supabase/functions/_shared/entitlements.ts`.
 */
export const FREE_TIER_BILL_RECEIPT_LIMIT = 3;

export function countBillOrReceiptUploadsInProject(
  rows: { document_type?: string | null }[],
): number {
  return rows.filter((r) =>
    isArchitectQuotaInvoiceType(r.document_type ?? "invoice"),
  ).length;
}
