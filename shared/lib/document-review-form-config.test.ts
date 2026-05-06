import { describe, it, expect } from "vitest";
import {
  effectiveLedgerEntryTotalForSave,
  ledgerReviewAmountFieldMode,
  ledgerReviewDateFieldsForType,
  ledgerReviewSummaryHint,
  ledgerReviewSummaryPlaceholder,
  ledgerReviewTotalAmountHint,
  ledgerReviewTotalAmountLabel,
} from "./document-review-form-config.ts";
import type { LedgerDocumentType } from "./infer-document-type.ts";

describe("document-review-form-config", () => {
  it("treats invoice, quote, receipt as primary amount fields", () => {
    expect(ledgerReviewAmountFieldMode("invoice")).toBe("primary");
    expect(ledgerReviewAmountFieldMode("quote")).toBe("primary");
    expect(ledgerReviewAmountFieldMode("receipt")).toBe("primary");
  });

  it("hides amount for warranty and similar record types", () => {
    expect(ledgerReviewAmountFieldMode("warranty")).toBe("hidden");
    expect(ledgerReviewAmountFieldMode("permit")).toBe("hidden");
    expect(ledgerReviewAmountFieldMode("manual")).toBe("hidden");
  });

  it("uses optional value for contract and appraisal", () => {
    expect(ledgerReviewAmountFieldMode("contract")).toBe("optional_value");
    expect(ledgerReviewAmountFieldMode("appraisal")).toBe("optional_value");
  });

  it("effectiveLedgerEntryTotalForSave zeros hidden types regardless of input", () => {
    expect(effectiveLedgerEntryTotalForSave("warranty", "9999.99")).toBe(0);
    expect(effectiveLedgerEntryTotalForSave("invoice", "150")).toBe(150);
    expect(effectiveLedgerEntryTotalForSave("invoice", "")).toBe(0);
    expect(effectiveLedgerEntryTotalForSave("contract", "250000")).toBe(250000);
  });

  it("maps date review fields by document type", () => {
    expect(ledgerReviewDateFieldsForType("warranty").map((f) => f.key)).toEqual(
      ["warranty_expiry_date"],
    );
    expect(
      ledgerReviewDateFieldsForType("insurance").map((f) => f.key),
    ).toEqual(["insurance_renewal_date"]);
    expect(ledgerReviewDateFieldsForType("permit").map((f) => f.key)).toEqual([
      "permit_expiration_date",
    ]);
    expect(ledgerReviewDateFieldsForType("invoice")).toEqual([]);
  });

  describe("ledgerReviewTotalAmountLabel", () => {
    it("labels primary and optional types", () => {
      expect(ledgerReviewTotalAmountLabel("invoice")).toBe("Total amount ($)");
      expect(ledgerReviewTotalAmountLabel("contract")).toBe(
        "Contract value ($)",
      );
      expect(ledgerReviewTotalAmountLabel("appraisal")).toBe(
        "Appraised / stated value ($)",
      );
    });

    it("returns empty for hidden amount modes", () => {
      expect(ledgerReviewTotalAmountLabel("warranty")).toBe("");
      expect(ledgerReviewTotalAmountLabel("permit")).toBe("");
    });
  });

  describe("ledgerReviewTotalAmountHint", () => {
    it("returns hints for primary and optional modes", () => {
      expect(ledgerReviewTotalAmountHint("receipt")).toContain("tax");
      expect(ledgerReviewTotalAmountHint("contract")).toContain(
        "plan vs. actual",
      );
    });

    it("returns empty for hidden", () => {
      expect(ledgerReviewTotalAmountHint("manual")).toBe("");
    });
  });

  describe("ledgerReviewSummaryPlaceholder", () => {
    it("returns type-specific examples", () => {
      expect(ledgerReviewSummaryPlaceholder("invoice")).toContain("Electrical");
      expect(ledgerReviewSummaryPlaceholder("permit")).toContain("permit");
      expect(ledgerReviewSummaryPlaceholder("lien_waiver")).toContain("waiver");
    });

    it("falls back to other copy for unknown keys", () => {
      expect(
        ledgerReviewSummaryPlaceholder(
          "not-a-real-type" as unknown as LedgerDocumentType,
        ),
      ).toBe("e.g. Brief note on what this document is");
    });
  });

  describe("ledgerReviewSummaryHint", () => {
    it("returns type-specific guidance", () => {
      expect(ledgerReviewSummaryHint("invoice")).toContain("seller packet");
      expect(ledgerReviewSummaryHint("quote")).toContain("bids");
      expect(ledgerReviewSummaryHint("disclosure")).toContain("hazard");
    });

    it("falls back to other hint for unknown keys", () => {
      expect(
        ledgerReviewSummaryHint("xyz" as unknown as LedgerDocumentType),
      ).toBe("Short description for your records and AI context.");
    });
  });
});
