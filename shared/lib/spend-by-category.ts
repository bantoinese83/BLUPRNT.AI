import type { ScopeRow } from "../types/database";

export type InvoiceLineSpendRow = {
  category: string | null;
  line_total: number | null;
  scope_item_id: string | null;
};

/**
 * Sums line totals by scope category, using line `category` when set, otherwise
 * resolving `scope_item_id` to the scope row’s category.
 */
export function buildSpendByCategory(
  lines: InvoiceLineSpendRow[] | null | undefined,
  scopeItems: ScopeRow[],
): Record<string, number> {
  const categoryByScopeId = new Map(
    scopeItems.map((s) => [s.id, s.category] as const),
  );
  const out: Record<string, number> = {};
  for (const row of lines ?? []) {
    let cat = row.category?.trim() ?? "";
    if (!cat && row.scope_item_id) {
      cat = categoryByScopeId.get(row.scope_item_id) ?? "";
    }
    if (!cat) cat = "Uncategorized";
    const amt = Number(row.line_total) || 0;
    out[cat] = (out[cat] ?? 0) + amt;
  }
  return out;
}
