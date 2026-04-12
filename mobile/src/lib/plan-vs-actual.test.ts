import { describe, it, expect } from "vitest";
import {
  capitalImprovementTotal,
  planVsActualNarrative,
  planVsActualPdfLines,
} from "@/lib/plan-vs-actual";

describe("capitalImprovementTotal", () => {
  it("sums invoices and quotes only", () => {
    expect(
      capitalImprovementTotal([
        { total: 100, document_type: "invoice" },
        { total: 50, document_type: "quote" },
        { total: 999, document_type: "warranty" },
      ]),
    ).toBe(150);
  });
});

describe("planVsActualNarrative", () => {
  it("handles no estimate", () => {
    const n = planVsActualNarrative(null, null, 0);
    expect(n.kind).toBe("no_estimate");
  });

  it("handles no documents", () => {
    const n = planVsActualNarrative(1, 2, 0);
    expect(n.kind).toBe("no_documents");
  });

  it("handles within range", () => {
    const n = planVsActualNarrative(100, 200, 150);
    expect(n.kind).toBe("within");
  });

  it("handles below min", () => {
    const n = planVsActualNarrative(500, 600, 100);
    expect(n.kind).toBe("below_min");
  });

  it("handles above max", () => {
    const n = planVsActualNarrative(100, 200, 500);
    expect(n.kind).toBe("above_max");
  });
});

describe("planVsActualPdfLines", () => {
  it("returns five lines", () => {
    const lines = planVsActualPdfLines(10, 20, 15);
    expect(lines).toHaveLength(5);
    expect(lines[0]).toContain("Estimated range");
  });
});
