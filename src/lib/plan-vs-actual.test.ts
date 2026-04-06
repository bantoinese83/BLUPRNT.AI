import { describe, it, expect } from "vitest";
import {
  capitalImprovementTotal,
  planVsActualNarrative,
  planVsActualPdfLines,
} from "./plan-vs-actual";

describe("capitalImprovementTotal", () => {
  it("sums invoice and quote types only", () => {
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
  it("handles missing estimate", () => {
    const r = planVsActualNarrative(null, null, 500);
    expect(r.kind).toBe("no_estimate");
  });

  it("handles zero spend", () => {
    const r = planVsActualNarrative(10_000, 20_000, 0);
    expect(r.kind).toBe("no_documents");
  });

  it("within range", () => {
    const r = planVsActualNarrative(10_000, 20_000, 15_000);
    expect(r.kind).toBe("within");
  });

  it("below min", () => {
    const r = planVsActualNarrative(10_000, 20_000, 2000);
    expect(r.kind).toBe("below_min");
  });

  it("above max", () => {
    const r = planVsActualNarrative(10_000, 20_000, 25_000);
    expect(r.kind).toBe("above_max");
  });
});

describe("planVsActualPdfLines", () => {
  it("returns multiple lines", () => {
    const lines = planVsActualPdfLines(10_000, 20_000, 15_000);
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines.some((l) => l.includes("Documented"))).toBe(true);
  });
});
