import { describe, it, expect } from "vitest";
import {
  ledgerDocumentTypeLabel,
  reviewDocumentModalTitle,
  ledgerDocumentVisualGroup,
  defaultVendorNameForDocumentType,
  defaultLineDescriptionForUpload,
  ledgerDocumentTheme,
} from "./ledger-document-labels.ts";

describe("ledger-document-labels", () => {
  describe("ledgerDocumentTypeLabel", () => {
    it("returns correct labels", () => {
      expect(ledgerDocumentTypeLabel("invoice")).toBe("Invoice / bill");
      expect(ledgerDocumentTypeLabel("quote")).toBe("Quote / estimate");
      expect(ledgerDocumentTypeLabel("receipt")).toBe("Receipt");
      expect(ledgerDocumentTypeLabel("warranty")).toBe("Warranty");
    });

    it("defaults to invoice on nullish", () => {
      expect(ledgerDocumentTypeLabel(null)).toBe("Invoice / bill");
      expect(ledgerDocumentTypeLabel(undefined)).toBe("Invoice / bill");
    });

    it("handles unknown types gracefully", () => {
      expect(ledgerDocumentTypeLabel("custom_record")).toBe("custom record");
    });
  });

  describe("reviewDocumentModalTitle", () => {
    it("returns correct titles", () => {
      expect(reviewDocumentModalTitle("invoice")).toBe(
        "Review bill or invoice",
      );
      expect(reviewDocumentModalTitle("permit")).toBe(
        "Review permit or approval",
      );
      expect(reviewDocumentModalTitle("other")).toBe("Review document");
    });
  });

  describe("ledgerDocumentVisualGroup", () => {
    it("categorizes correctly", () => {
      expect(ledgerDocumentVisualGroup("invoice")).toBe("spend");
      expect(ledgerDocumentVisualGroup("quote")).toBe("spend");
      expect(ledgerDocumentVisualGroup("receipt")).toBe("spend");
      expect(ledgerDocumentVisualGroup("warranty")).toBe("warranty_care");
      expect(ledgerDocumentVisualGroup("maintenance")).toBe("warranty_care");
      expect(ledgerDocumentVisualGroup("permit")).toBe("archive");
      expect(ledgerDocumentVisualGroup("other")).toBe("archive");
    });
  });

  describe("defaultVendorNameForDocumentType", () => {
    it("returns correct default names", () => {
      expect(defaultVendorNameForDocumentType("invoice")).toBe("Vendor");
      expect(defaultVendorNameForDocumentType("permit")).toBe("Permit");
      expect(defaultVendorNameForDocumentType("other")).toBe("Document");
    });
  });

  describe("defaultLineDescriptionForUpload", () => {
    it("formats maintenance logs", () => {
      expect(defaultLineDescriptionForUpload("maintenance", "ACME")).toBe(
        "Log — ACME",
      );
      expect(defaultLineDescriptionForUpload("maintenance", null)).toBe(
        "Maintenance log entry",
      );
    });

    it("formats spend docs", () => {
      expect(defaultLineDescriptionForUpload("invoice", "ACME")).toBe(
        "Services or purchase — ACME",
      );
      expect(defaultLineDescriptionForUpload("receipt", null)).toBe(
        "Receipt line",
      );
    });
  });

  describe("ledgerDocumentTheme", () => {
    it("returns spend theme for invoices", () => {
      const theme = ledgerDocumentTheme("invoice");
      expect(theme.icon).toBe("text-rose-600");
      expect(theme.label).toBe("Vendor Name");
    });

    it("returns warranty theme for warranties", () => {
      const theme = ledgerDocumentTheme("warranty");
      expect(theme.icon).toBe("text-teal-600");
      expect(theme.label).toBe("Brand / Provider");
    });

    it("returns default theme for others", () => {
      const theme = ledgerDocumentTheme("permit");
      expect(theme.icon).toBe("text-slate-600");
      expect(theme.label).toBe("Issuer / Category");
    });
  });
});
