import { describe, it, expect } from "vitest";
import {
  capitalImprovementTotal,
  maintenanceDocumentTotal,
  filterLedgerEntriesByDocumentFilter,
  planVsActualNarrative,
  planVsActualPdfLines,
} from "./plan-vs-actual";

describe("capitalImprovementTotal", () => {
  it("sums invoice, quote, and receipt only", () => {
    expect(
      capitalImprovementTotal([
        { total: 100, document_type: "invoice" },
        { total: 50, document_type: "quote" },
        { total: 20, document_type: "receipt" },
        { total: 999, document_type: "warranty" },
        { total: 1, document_type: "permit" },
        { total: 5, document_type: "other" },
      ]),
    ).toBe(170);
  });
});

describe("maintenanceDocumentTotal", () => {
  it("sums non–plan-vs-actual types (record / compliance bucket)", () => {
    expect(
      maintenanceDocumentTotal([
        { total: 100, document_type: "invoice" },
        { total: 40, document_type: "warranty" },
        { total: 25, document_type: "permit" },
        { total: 12, document_type: "maintenance" },
        { total: 7, document_type: "insurance" },
      ]),
    ).toBe(84);
  });
});

describe("filterLedgerEntriesByDocumentFilter", () => {
  const rows = [
    { total: 1, document_type: "invoice" as const },
    { total: 2, document_type: "receipt" as const },
    { total: 2, document_type: "warranty" as const },
    { total: 3, document_type: "other" as const },
  ];

  it("returns all when filter is all", () => {
    expect(filterLedgerEntriesByDocumentFilter(rows, "all").length).toBe(4);
  });

  it("returns capital subset (invoice, quote, receipt)", () => {
    expect(filterLedgerEntriesByDocumentFilter(rows, "capital")).toEqual([
      rows[0],
      rows[1],
    ]);
  });

  it("returns records subset", () => {
    expect(filterLedgerEntriesByDocumentFilter(rows, "maintenance")).toEqual([
      rows[2],
      rows[3],
    ]);
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
