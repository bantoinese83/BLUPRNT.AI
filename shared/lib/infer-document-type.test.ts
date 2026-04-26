import { describe, it, expect } from "vitest";
import {
  coerceLedgerDocumentType,
  inferDocumentTypeFromFilename,
  isArchitectQuotaInvoiceType,
  isCapitalLedgerDocumentType,
  isInvoiceStyleOcrType,
  isPlanVsActualDocumentType,
  LEDGER_DOCUMENT_TYPES,
} from "./infer-document-type.ts";

describe("coerceLedgerDocumentType", () => {
  it("returns known types case-insensitively", () => {
    expect(coerceLedgerDocumentType("INVOICE")).toBe("invoice");
    expect(coerceLedgerDocumentType("  Quote  ")).toBe("quote");
    expect(coerceLedgerDocumentType("permit")).toBe("permit");
  });

  it("defaults empty or nullish input to invoice", () => {
    expect(coerceLedgerDocumentType("")).toBe("invoice");
    expect(coerceLedgerDocumentType(null)).toBe("invoice");
    expect(coerceLedgerDocumentType(undefined)).toBe("invoice");
    expect(coerceLedgerDocumentType("   ")).toBe("invoice");
  });

  it("maps unknown strings to other", () => {
    expect(coerceLedgerDocumentType("mystery.pdf")).toBe("other");
  });
});

describe("isPlanVsActualDocumentType / isCapitalLedgerDocumentType", () => {
  it("identifies spend document types", () => {
    expect(isPlanVsActualDocumentType("invoice")).toBe(true);
    expect(isPlanVsActualDocumentType("quote")).toBe(true);
    expect(isPlanVsActualDocumentType("receipt")).toBe(true);
    expect(isPlanVsActualDocumentType("permit")).toBe(false);
    expect(isCapitalLedgerDocumentType("RECEIPT")).toBe(true);
    expect(isCapitalLedgerDocumentType("warranty")).toBe(false);
  });
});

describe("inferDocumentTypeFromFilename", () => {
  it("detects common filenames", () => {
    expect(inferDocumentTypeFromFilename("Kitchen remodel invoice.pdf")).toBe(
      "invoice",
    );
    expect(inferDocumentTypeFromFilename("ACME_quote_final.pdf")).toBe("quote");
    expect(inferDocumentTypeFromFilename("store-receipt.png")).toBe("receipt");
    expect(inferDocumentTypeFromFilename("building_permit_scan.pdf")).toBe(
      "permit",
    );
    expect(inferDocumentTypeFromFilename("hoa_approval.pdf")).toBe("hoa");
    expect(inferDocumentTypeFromFilename("certificate_of_insurance.pdf")).toBe(
      "insurance",
    );
    expect(inferDocumentTypeFromFilename("appraisal_report.pdf")).toBe(
      "appraisal",
    );
    expect(inferDocumentTypeFromFilename("maintenance-log.pdf")).toBe(
      "maintenance",
    );
    expect(inferDocumentTypeFromFilename("warranty_card.pdf")).toBe("warranty");
    expect(inferDocumentTypeFromFilename("user-manual.pdf")).toBe("manual");
    expect(inferDocumentTypeFromFilename("hers_rating.pdf")).toBe("energy");
    expect(inferDocumentTypeFromFilename("lead_paint_disclosure.pdf")).toBe(
      "disclosure",
    );
    expect(inferDocumentTypeFromFilename("lien_waiver_release.pdf")).toBe(
      "lien_waiver",
    );
    expect(inferDocumentTypeFromFilename("renovation_contract.pdf")).toBe(
      "contract",
    );
  });

  it("handles complex patterns and edge cases", () => {
    expect(inferDocumentTypeFromFilename("home inspection report")).toBe(
      "inspection",
    );
    expect(inferDocumentTypeFromFilename("permit for plan check")).toBe(
      "permit",
    );
    expect(inferDocumentTypeFromFilename("maintenance log book")).toBe(
      "maintenance",
    );
    expect(inferDocumentTypeFromFilename("receipt for payment")).toBe(
      "receipt",
    );
    expect(inferDocumentTypeFromFilename("invoice_po_123")).toBe("invoice");
    expect(inferDocumentTypeFromFilename("inspection.pdf")).toBe("inspection");
    expect(inferDocumentTypeFromFilename("energy.png")).toBe("energy");
    expect(inferDocumentTypeFromFilename("maintenance.pdf")).toBe(
      "maintenance",
    );
  });

  it("returns null when no pattern matches", () => {
    expect(inferDocumentTypeFromFilename("scan_001.pdf")).toBe(null);
    expect(inferDocumentTypeFromFilename("")).toBe(null);
  });
});

describe("isInvoiceStyleOcrType", () => {
  it("is true only for invoice and receipt", () => {
    expect(isInvoiceStyleOcrType("invoice")).toBe(true);
    expect(isInvoiceStyleOcrType("receipt")).toBe(true);
    expect(isInvoiceStyleOcrType("quote")).toBe(false);
  });
});

describe("isArchitectQuotaInvoiceType", () => {
  it("counts invoice and receipt only", () => {
    expect(isArchitectQuotaInvoiceType("invoice")).toBe(true);
    expect(isArchitectQuotaInvoiceType("Receipt")).toBe(true);
    expect(isArchitectQuotaInvoiceType("quote")).toBe(false);
  });
});

describe("LEDGER_DOCUMENT_TYPES", () => {
  it("lists every coerce target", () => {
    for (const t of LEDGER_DOCUMENT_TYPES) {
      expect(coerceLedgerDocumentType(t)).toBe(t);
    }
  });
});
