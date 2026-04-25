import type { ScopeRow } from "../types/database.ts";

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

  if (!scopeItems.length || !lineItems.length) {
    // If we have no scope items, we can't reconcile anything.
    // If we have no lines, total_reconciled is 0.
    // However, if we have lines but no scope items, they all go to unreconciled_billed.
    if (!scopeItems.length && lineItems.length) {
      result.unreconciled_billed = lineItems.reduce(
        (s, l) => s + (l.line_total || 0),
        0,
      );
    }
    return result;
  }

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

    const recon = itemMap[scope.id];
    if (recon) {
      recon.total_billed += amount;
      recon.invoice_count += 1;
    }
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
