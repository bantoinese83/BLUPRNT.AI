import { describe, it, expect } from "vitest";
import {
  countInvoiceDocuments,
  isFreeTierInvoiceLimitReached,
} from "@/lib/invoice-upload-gate";
import type { InvoiceRow } from "@shared/types/database";

function invoiceRow(partial: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: partial.id ?? "i1",
    vendor_name: partial.vendor_name ?? null,
    total: partial.total ?? 0,
    created_at: partial.created_at ?? new Date().toISOString(),
    payment_status: partial.payment_status ?? null,
    document_type: partial.document_type ?? "invoice",
    document_id: partial.document_id ?? null,
  };
}

describe("countInvoiceDocuments", () => {
  it("counts rows with default invoice type", () => {
    expect(
      countInvoiceDocuments([
        invoiceRow({ document_type: "invoice" }),
        invoiceRow({ document_type: "quote" }),
      ]),
    ).toBe(1);
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
