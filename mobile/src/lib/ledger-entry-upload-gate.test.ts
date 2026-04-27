import { describe, it, expect } from "vitest";
import {
  countLedgerEntryDocuments,
  isFreeTierLedgerEntryLimitReached,
} from "@/lib/ledger-entry-upload-gate";
import type { LedgerEntryRow } from "@shared/types/database";

function ledgerEntryRow(partial: Partial<LedgerEntryRow> = {}): LedgerEntryRow {
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
  } as LedgerEntryRow;
}

describe("countLedgerEntryDocuments", () => {
  it("counts invoice and receipt toward cap, not quote-only rows", () => {
    expect(
      countLedgerEntryDocuments([
        ledgerEntryRow({ document_type: "invoice" }),
        ledgerEntryRow({ document_type: "receipt" }),
        ledgerEntryRow({ document_type: "quote" }),
      ]),
    ).toBe(2);
  });
});

describe("isFreeTierLedgerEntryLimitReached", () => {
  it("is false for paid tiers", () => {
    const many = Array.from({ length: 5 }, () => ledgerEntryRow());
    expect(isFreeTierLedgerEntryLimitReached(many as any, true, false)).toBe(
      false,
    );
    expect(isFreeTierLedgerEntryLimitReached(many as any, false, true)).toBe(
      false,
    );
  });

  it("is true on third invoice for free tier", () => {
    const three = [
      ledgerEntryRow({ id: "1" }),
      ledgerEntryRow({ id: "2" }),
      ledgerEntryRow({ id: "3" }),
    ];
    expect(isFreeTierLedgerEntryLimitReached(three as any, false, false)).toBe(
      true,
    );
  });

  it("is false below limit", () => {
    const two = [ledgerEntryRow({ id: "1" }), ledgerEntryRow({ id: "2" })];
    expect(isFreeTierLedgerEntryLimitReached(two as any, false, false)).toBe(
      false,
    );
  });
});
