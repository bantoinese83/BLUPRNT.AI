import type { ScopeRow } from "../types/database";

export type ReconciliationItem = {
  scope_item_id: string;
  total_billed: number;
  status: "under" | "reconciled" | "over";
  difference: number;
  invoice_count: number;
};

export type ReconciliationResult = {
  items: Record<string, ReconciliationItem>;
  total_reconciled: number;
  unreconciled_billed: number;
};

export type InvoiceLineItemMinimal = {
  line_total: number | null;
  scope_item_id: string | null;
  invoice_id: string;
};

/**
 * Calculates reconciliation status for each scope item based on linked invoice lines.
 */
export function buildReconciliation(
  scopeItems: ScopeRow[],
  lineItems: InvoiceLineItemMinimal[],
): ReconciliationResult {
  const result: ReconciliationResult = {
    items: {},
    total_reconciled: 0,
    unreconciled_billed: 0,
  };

  const scopeMap = new Map<string, ScopeRow>(scopeItems.map((s) => [s.id, s]));
  const itemMap: Record<string, ReconciliationItem> = {};

  for (const line of lineItems) {
    const amount = line.line_total || 0;
    if (!line.scope_item_id) {
      result.unreconciled_billed += amount;
      continue;
    }

    const scope = scopeMap.get(line.scope_item_id);
    if (!scope) {
      result.unreconciled_billed += amount;
      continue;
    }

    if (!itemMap[scope.id]) {
      itemMap[scope.id] = {
        scope_item_id: scope.id,
        total_billed: 0,
        status: "under",
        difference: 0,
        invoice_count: 0,
      };
    }

    itemMap[scope.id].total_billed += amount;
    itemMap[scope.id].invoice_count += 1;
    result.total_reconciled += amount;
  }

  // Calculate statuses
  for (const scope of scopeItems) {
    const recon = itemMap[scope.id];
    if (!recon) continue;

    const midEstimate =
      ((scope.total_cost_min || 0) + (scope.total_cost_max || 0)) / 2;
    // We consider "reconciled" if it's within 5% of the mid estimate or exactly equal
    const margin = midEstimate * 0.05;

    recon.difference = recon.total_billed - midEstimate;

    if (recon.total_billed > midEstimate + margin) {
      recon.status = "over";
    } else if (
      recon.total_billed < midEstimate - margin &&
      recon.total_billed > 0
    ) {
      recon.status = "under";
    } else {
      recon.status = "reconciled";
    }
  }

  result.items = itemMap;
  return result;
}
