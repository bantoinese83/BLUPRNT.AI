import { describe, it, expect } from "vitest";
import { FileText, FileQuestion, Receipt, ShieldCheck } from "lucide-react";
import {
  cardIconForDocumentType,
  reviewModalIconForDocumentType,
} from "./ledger-type-icons";

describe("ledger-type-icons", () => {
  it("returns the same icon for card and review modal for a known type", () => {
    const card = cardIconForDocumentType("invoice");
    const review = reviewModalIconForDocumentType("invoice");
    expect(card).toBe(FileText);
    expect(review).toBe(FileText);
  });

  it("maps spend types to distinct icons", () => {
    expect(cardIconForDocumentType("receipt")).toBe(Receipt);
    expect(reviewModalIconForDocumentType("warranty")).toBe(ShieldCheck);
  });

  it("falls back for unknown types via coerce → other", () => {
    expect(cardIconForDocumentType("not-a-real-type")).toBe(FileQuestion);
    expect(reviewModalIconForDocumentType(undefined)).toBe(FileText);
  });
});
