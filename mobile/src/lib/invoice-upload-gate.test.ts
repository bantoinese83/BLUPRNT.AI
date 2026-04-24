import { describe, it, expect } from "vitest";
import {
  countInvoiceDocuments,
  isFreeTierInvoiceLimitReached,
} from "@/lib/invoice-upload-gate";
import type { InvoiceRow } from "@shared/types/database";

function invoiceRow(partial: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: "i1",
    vendor_name: null,
    total: 0,
    created_at: new Date().toISOString(),
    payment_status: "unpaid",
    document_type: "invoice",
    document_id: null,
    issue_date: null,
    project_id: "p1",
    vendor_contact_info: {},
    warranty_expiry_date: null,
    ...partial,
  } as InvoiceRow;
}

describe("countInvoiceDocuments", () => {
  it("counts invoice and receipt toward cap, not quote-only rows", () => {
    expect(
      countInvoiceDocuments([
        invoiceRow({ document_type: "invoice" }),
        invoiceRow({ document_type: "receipt" }),
        invoiceRow({ document_type: "quote" }),
      ]),
    ).toBe(2);
  });
});

describe("isFreeTierInvoiceLimitReached", () => {
  it("is false for paid tiers", () => {
    const many = Array.from({ length: 5 }, () => invoiceRow());
    expect(isFreeTierInvoiceLimitReached(many, true, false)).toBe(false);
    expect(isFreeTierInvoiceLimitReached(many, false, true)).toBe(false);
  });

  it("is true on third invoice for free tier", () => {
    const three = [
      invoiceRow({ id: "1" }),
      invoiceRow({ id: "2" }),
      invoiceRow({ id: "3" }),
    ];
    expect(isFreeTierInvoiceLimitReached(three, false, false)).toBe(true);
  });

  it("is false below limit", () => {
    const two = [invoiceRow({ id: "1" }), invoiceRow({ id: "2" })];
    expect(isFreeTierInvoiceLimitReached(two, false, false)).toBe(false);
  });
});
