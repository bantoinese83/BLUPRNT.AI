import { describe, it, expect } from "vitest";
import {
  defaultLineDescriptionForUpload,
  defaultVendorNameForDocumentType,
  ledgerDocumentTypeLabel,
  ledgerDocumentVisualGroup,
  reviewDocumentModalTitle,
} from "./ledger-document-labels.ts";

describe("ledgerDocumentTypeLabel", () => {
  it("returns mapped labels for known types", () => {
    expect(ledgerDocumentTypeLabel("invoice")).toBe("Invoice / bill");
    expect(ledgerDocumentTypeLabel("lien_waiver")).toBe(
      "Lien waiver / release",
    );
  });

  it("defaults nullish to invoice label", () => {
    expect(ledgerDocumentTypeLabel(null)).toBe("Invoice / bill");
  });

  it("title-cases unknown keys for map miss", () => {
    expect(ledgerDocumentTypeLabel("custom_type")).toBe("custom type");
  });
});

describe("reviewDocumentModalTitle", () => {
  it("uses coerce for unknown input", () => {
    expect(reviewDocumentModalTitle("invoice")).toContain("invoice");
    expect(reviewDocumentModalTitle("garbage")).toBe("Review document");
  });
});

describe("ledgerDocumentVisualGroup", () => {
  it("groups spend, care, and archive", () => {
    expect(ledgerDocumentVisualGroup("invoice")).toBe("spend");
    expect(ledgerDocumentVisualGroup("warranty")).toBe("warranty_care");
    expect(ledgerDocumentVisualGroup("permit")).toBe("archive");
  });
});

describe("defaultVendorNameForDocumentType", () => {
  it("covers every ledger type", () => {
    expect(defaultVendorNameForDocumentType("invoice")).toBe("Vendor");
    expect(defaultVendorNameForDocumentType("other")).toBe("Document");
  });
});

describe("defaultLineDescriptionForUpload", () => {
  it("formats maintenance and spend lines", () => {
    expect(defaultLineDescriptionForUpload("maintenance", "Roof")).toBe(
      "Log — Roof",
    );
    expect(defaultLineDescriptionForUpload("maintenance", null)).toBe(
      "Maintenance log entry",
    );
    expect(defaultLineDescriptionForUpload("invoice", "ACME")).toBe(
      "Services or purchase — ACME",
    );
    expect(defaultLineDescriptionForUpload("receipt", "")).toBe("Receipt line");
    expect(defaultLineDescriptionForUpload("quote", "")).toBe("Invoice line");
    expect(defaultLineDescriptionForUpload("permit", "City")).toBe(
      "Record — City",
    );
    expect(defaultLineDescriptionForUpload("permit", "")).toBe("Recorded line");
  });
});
