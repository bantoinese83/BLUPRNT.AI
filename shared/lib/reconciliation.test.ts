import { describe, it, expect } from "vitest";
import { buildReconciliation } from "./reconciliation";
import type { ScopeRow } from "../types/database";

describe("buildReconciliation", () => {
  const mockScopes: Partial<ScopeRow>[] = [
    {
      id: "s1",
      total_cost_min: 100,
      total_cost_max: 200,
      category: "Flooring",
    },
    { id: "s2", total_cost_min: 500, total_cost_max: 500, category: "Paint" },
  ];

  it("calculates 'under' status when billed is below low estimate", () => {
    const lines = [{ invoice_id: "i1", line_total: 50, scope_item_id: "s1" }];
    const result = buildReconciliation(mockScopes as ScopeRow[], lines);

    expect(result.items["s1"].status).toBe("under");
    expect(result.items["s1"].total_billed).toBe(50);
    expect(result.total_reconciled).toBe(50);
  });

  it("calculates 'reconciled' status when billed is within margin", () => {
    const lines = [
      { invoice_id: "i1", line_total: 155, scope_item_id: "s1" }, // Mid is 150, 5% margin is 7.5
    ];
    const result = buildReconciliation(mockScopes as ScopeRow[], lines);

    expect(result.items["s1"].status).toBe("reconciled");
  });

  it("calculates 'over' status when billed exceeds high estimate + margin", () => {
    const lines = [{ invoice_id: "i1", line_total: 600, scope_item_id: "s2" }];
    const result = buildReconciliation(mockScopes as ScopeRow[], lines);

    expect(result.items["s2"].status).toBe("over");
    expect(result.items["s2"].difference).toBe(100);
  });

  it("tracks unreconciled billed amounts", () => {
    const lines = [
      { invoice_id: "i1", line_total: 100, scope_item_id: null },
      { invoice_id: "i2", line_total: 200, scope_item_id: "non-existent" },
    ];
    const result = buildReconciliation(mockScopes as ScopeRow[], lines);

    expect(result.unreconciled_billed).toBe(300);
    expect(result.total_reconciled).toBe(0);
  });
});
