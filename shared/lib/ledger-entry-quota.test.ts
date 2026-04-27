import { describe, it, expect } from "vitest";
import {
  countBillOrReceiptUploadsInProject,
  FREE_TIER_BILL_RECEIPT_LIMIT,
} from "./ledger-entry-quota.ts";

describe("ledger-entry-quota", () => {
  it("should have a limit of 3", () => {
    expect(FREE_TIER_BILL_RECEIPT_LIMIT).toBe(3);
  });

  it("should count only invoices and receipts", () => {
    const rows = [
      { document_type: "invoice" },
      { document_type: "receipt" },
      { document_type: "quote" }, // Doesn't count
      { document_type: "warranty" }, // Doesn't count
      { document_type: "permit" }, // Doesn't count
      { document_type: null }, // Defaults to invoice -> counts
      { document_type: "receipt " }, // Trimmed -> counts
    ];

    expect(countBillOrReceiptUploadsInProject(rows)).toBe(4); // invoice, receipt, null, receipt
  });

  it("should return 0 for empty list", () => {
    expect(countBillOrReceiptUploadsInProject([])).toBe(0);
  });

  it("should handle mixed case and whitespace", () => {
    const rows = [{ document_type: " INVOICE " }, { document_type: "Receipt" }];
    expect(countBillOrReceiptUploadsInProject(rows)).toBe(2);
  });
});
