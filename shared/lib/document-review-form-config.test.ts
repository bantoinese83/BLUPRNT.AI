import { describe, it, expect } from "vitest";
import {
  effectiveLedgerEntryTotalForSave,
  ledgerReviewAmountFieldMode,
  ledgerReviewDateFieldsForType,
} from "./document-review-form-config.ts";

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
});
