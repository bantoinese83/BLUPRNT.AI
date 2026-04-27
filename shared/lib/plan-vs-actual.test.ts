import { describe, it, expect } from "vitest";
import {
  capitalImprovementTotal,
  maintenanceDocumentTotal,
  planVsActualNarrative,
  filterLedgerEntriesByDocumentFilter,
  planVsActualPdfLines,
  calculateBudgetStats,
} from "./plan-vs-actual.ts";

describe("plan-vs-actual shared logic", () => {
  describe("capitalImprovementTotal", () => {
    it("sums only invoice, quote, and receipt types", () => {
      const invoices = [
        { total: 100, document_type: "invoice" },
        { total: 200, document_type: "quote" },
        { total: 300, document_type: "receipt" },
        { total: 400, document_type: "permit" }, // Should be ignored
        { total: 500, document_type: "warranty" }, // Should be ignored
      ];
      expect(capitalImprovementTotal(invoices)).toBe(600);
    });

    it("handles null/missing totals and document types", () => {
      const invoices = [
        { total: 100, document_type: null }, // Defaults to invoice
        { total: null, document_type: "invoice" }, // Ignored (0)
        { total: 200 }, // Defaults to invoice
      ];
      expect(capitalImprovementTotal(invoices)).toBe(300);
    });

    it("is case-insensitive for document types", () => {
      const invoices = [
        { total: 100, document_type: "INVOICE" },
        { total: 200, document_type: "Quote " },
      ];
      expect(capitalImprovementTotal(invoices)).toBe(300);
    });
  });

  describe("maintenanceDocumentTotal", () => {
    it("sums only non-capital document types", () => {
      const invoices = [
        { total: 100, document_type: "invoice" }, // Ignored
        { total: 200, document_type: "permit" },
        { total: 300, document_type: "warranty" },
      ];
      expect(maintenanceDocumentTotal(invoices)).toBe(500);
    });

    it("handles empty or missing document types as capital (default invoice)", () => {
      const invoices = [
        { total: 100, document_type: "" }, // Defaults to invoice -> ignored for maintenance
        { total: 200, document_type: "other" },
      ];
      expect(maintenanceDocumentTotal(invoices)).toBe(200);
    });
  });

  describe("planVsActualNarrative", () => {
    it("returns no_estimate when both bounds are null", () => {
      const res = planVsActualNarrative(null, null, 1000);
      expect(res.kind).toBe("no_estimate");
    });

    it("returns no_documents when total spend is 0", () => {
      const res = planVsActualNarrative(100, 200, 0);
      expect(res.kind).toBe("no_documents");
    });

    it("returns within when spend is inside range", () => {
      const res = planVsActualNarrative(1000, 2000, 1500);
      expect(res.kind).toBe("within");
    });

    it("returns within even if range is single point (min=max)", () => {
      const res = planVsActualNarrative(1000, 1000, 1000);
      expect(res.kind).toBe("within");
    });

    it("returns below_min when spend is lower than range", () => {
      const res = planVsActualNarrative(1000, 2000, 500);
      expect(res.kind).toBe("below_min");
      expect(res.body).toContain("$500 less");
    });

    it("returns above_max when spend is higher than range", () => {
      const res = planVsActualNarrative(1000, 2000, 2500);
      expect(res.kind).toBe("above_max");
      expect(res.body).toContain("$500 over");
    });

    it("corrects swapped min/max automatically", () => {
      const res = planVsActualNarrative(2000, 1000, 1500);
      expect(res.kind).toBe("within");
    });

    it("handles single bound in narrative (min only)", () => {
      const res = planVsActualNarrative(1000, null, 1500);
      expect(res.kind).toBe("above_max");
    });

    it("handles single bound in narrative (max only)", () => {
      const res = planVsActualNarrative(null, 1000, 500);
      expect(res.kind).toBe("below_min");
    });

    it("handles swapped bounds gracefully", () => {
      const stats = calculateBudgetStats(2000, 1000, 1500);
      expect(stats.estimatedMid).toBe(1500);
      expect(stats.budgetPct).toBe(100);
    });
  });

  describe("filterLedgerEntriesByDocumentFilter", () => {
    const invoices = [
      { id: 1, total: 100, document_type: "invoice" },
      { id: 2, total: 200, document_type: "permit" },
    ];

    it("returns all when filter is all", () => {
      expect(filterLedgerEntriesByDocumentFilter(invoices, "all")).toHaveLength(
        2,
      );
    });

    it("returns only capital when filter is capital", () => {
      const res = filterLedgerEntriesByDocumentFilter(invoices, "capital");
      expect(res).toHaveLength(1);
      expect(res[0]!.id).toBe(1);
    });

    it("returns only maintenance when filter is maintenance", () => {
      const res = filterLedgerEntriesByDocumentFilter(invoices, "maintenance");
      expect(res).toHaveLength(1);
      expect(res[0]!.id).toBe(2);
    });

    it("handles missing document type as capital (default invoice)", () => {
      const mixed = [
        { id: 1, total: 100 }, // missing type -> capital
        { id: 2, total: 200, document_type: "permit" }, // maintenance
      ];
      const cap = filterLedgerEntriesByDocumentFilter(mixed, "capital");
      const main = filterLedgerEntriesByDocumentFilter(mixed, "maintenance");
      expect(cap).toHaveLength(1);
      expect(main).toHaveLength(1);
    });
  });

  describe("planVsActualPdfLines", () => {
    it("generates correct lines for a range", () => {
      const lines = planVsActualPdfLines(1000, 2000, 1500);
      expect(lines).toHaveLength(5);
      expect(lines[0]).toContain("$1,000 – $2,000");
      expect(lines[1]).toContain("$1,500");
      expect(lines[2]).toContain("Within your estimate range");
    });

    it("generates correct lines for a single point", () => {
      const lines = planVsActualPdfLines(1000, 1000, 1000);
      expect(lines[0]).toContain("$1,000");
      expect(lines[0]).not.toContain("–");
    });

    it("handles null bounds in PDF lines", () => {
      const lines = planVsActualPdfLines(null, null, 0);
      expect(lines[0]).toContain("—");
    });

    it("handles single bound in PDF lines", () => {
      const lines = planVsActualPdfLines(1000, null, 1000);
      expect(lines[0]).toContain("$1,000");
    });

    it("handles max-only bound in PDF lines", () => {
      const lines = planVsActualPdfLines(null, 2000, 1000);
      expect(lines[0]).toContain("$2,000");
    });
  });

  describe("calculateBudgetStats", () => {
    it("calculates midpoint and percentage correctly", () => {
      const stats = calculateBudgetStats(1000, 2000, 500);
      expect(stats.estimatedMid).toBe(1500);
      expect(stats.budgetPct).toBe(33); // 500/1500 = 0.333
    });

    it("handles null bounds by using 0 as midpoint", () => {
      const stats = calculateBudgetStats(null, null, 500);
      expect(stats.estimatedMid).toBe(0);
      expect(stats.budgetPct).toBe(0);
    });

    it("handles zero midpoint to avoid NaN", () => {
      const stats = calculateBudgetStats(0, 0, 500);
      expect(stats.estimatedMid).toBe(0);
      expect(stats.budgetPct).toBe(0);
    });

    it("handles single bound correctly", () => {
      const stats = calculateBudgetStats(1000, null, 250);
      expect(stats.estimatedMid).toBe(1000);
      expect(stats.budgetPct).toBe(25);
    });

    it("caps percentage at 100", () => {
      const stats = calculateBudgetStats(500, 1000, 2000);
      expect(stats.estimatedMid).toBe(750);
      expect(stats.budgetPct).toBe(100);
    });
  });
});
