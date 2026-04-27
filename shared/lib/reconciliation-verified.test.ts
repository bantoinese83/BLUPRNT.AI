import { describe, it, expect } from "vitest";
import {
  buildReconciliation,
  type LedgerLineItemMinimal,
} from "./reconciliation.ts";
import type { ScopeRow } from "../types/database.ts";

describe("reconciliation - AI verification status", () => {
  const mockScope = [
    {
      id: "s1",
      category: "Kitchen",
      description: "Cabinets",
      total_cost_min: 1000,
      total_cost_max: 2000,
      project_id: "p1",
      created_at: "",
      updated_at: "",
      order_index: 0,
      quantity: 1,
      unit: "ea",
      unit_cost_min: 1000,
      unit_cost_max: 2000,
      metadata: null,
    },
  ] as unknown as ScopeRow[];

  it("correctly tracks unverified spend within reconciled totals", () => {
    const lines: LedgerLineItemMinimal[] = [
      {
        ledger_entry_id: "inv-unverified",
        line_total: 1200,
        scope_item_id: "s1",
        is_verified: false,
      },
      {
        ledger_entry_id: "inv-verified",
        line_total: 300,
        scope_item_id: "s1",
        is_verified: true,
      },
    ];

    const result = buildReconciliation(mockScope, lines);

    // Total should be the sum of both
    expect(result.total_reconciled).toBe(1500);
    // Unverified portion should be isolated
    expect(result.unverified_reconciled_spend).toBe(1200);
    // Item status should still reflect the total
    expect(result.items["s1"]!.total_billed).toBe(1500);
    expect(result.items["s1"]!.status).toBe("reconciled");
  });

  it("handles unverified unreconciled spend (not linked to scope)", () => {
    const lines: LedgerLineItemMinimal[] = [
      {
        ledger_entry_id: "inv-orphan",
        line_total: 500,
        scope_item_id: null,
        is_verified: false,
      },
    ];

    const result = buildReconciliation(mockScope, lines);

    expect(result.total_reconciled).toBe(0);
    expect(result.unreconciled_billed).toBe(500);
    // unverified_reconciled_spend only tracks LINKED spend
    expect(result.unverified_reconciled_spend).toBe(0);
  });

  it("returns zero unverified spend when all are verified", () => {
    const lines: LedgerLineItemMinimal[] = [
      {
        ledger_entry_id: "inv-1",
        line_total: 1000,
        scope_item_id: "s1",
        is_verified: true,
      },
    ];

    const result = buildReconciliation(mockScope, lines);
    expect(result.unverified_reconciled_spend).toBe(0);
  });

  it("defaults to verified if is_verified is missing", () => {
    const lines: LedgerLineItemMinimal[] = [
      {
        ledger_entry_id: "inv-legacy",
        line_total: 1000,
        scope_item_id: "s1",
      },
    ];

    const result = buildReconciliation(mockScope, lines);
    expect(result.unverified_reconciled_spend).toBe(0);
  });

  it("handles no scope items with existing lines", () => {
    const lines: LedgerLineItemMinimal[] = [
      { ledger_entry_id: "1", line_total: 500, scope_item_id: null },
    ];
    const result = buildReconciliation([], lines);
    expect(result.unreconciled_billed).toBe(500);
    expect(result.total_reconciled).toBe(0);
  });

  it("returns empty result for empty inputs", () => {
    const result = buildReconciliation([], []);
    expect(result.items).toEqual({});
    expect(result.total_reconciled).toBe(0);
  });

  it("handles lines with invalid scope_item_id", () => {
    const lines: LedgerLineItemMinimal[] = [
      { ledger_entry_id: "1", line_total: 500, scope_item_id: "invalid" },
    ];
    const result = buildReconciliation(mockScope, lines);
    expect(result.unreconciled_billed).toBe(500);
    expect(result.total_reconciled).toBe(0);
  });

  it("marks status as 'under' when spend is significantly below estimate", () => {
    const lines: LedgerLineItemMinimal[] = [
      { ledger_entry_id: "1", line_total: 100, scope_item_id: "s1" },
    ];
    // midEstimate is 1500, margin is 75. 100 is < 1425.
    const result = buildReconciliation(mockScope, lines);
    expect(result.items["s1"]!.status).toBe("under");
  });
});
