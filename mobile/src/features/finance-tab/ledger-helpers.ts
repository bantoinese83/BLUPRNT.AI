import type { LedgerEntryRow, ScopeRow } from "@shared/types/database";
import {
  capitalImprovementTotal,
  maintenanceDocumentTotal,
  filterLedgerEntriesByDocumentFilter,
  type LedgerDocumentFilter,
} from "@shared/lib/plan-vs-actual";

// Alias for backward compatibility if needed, but preferred LedgerDocumentFilter
export type { LedgerDocumentFilter };

export function computeLedgerStats(entries: LedgerEntryRow[]): {
  capital: number;
  maintenance: number;
  total: number;
} {
  const capital = capitalImprovementTotal(entries as any);
  const maintenance = maintenanceDocumentTotal(entries as any);
  return { capital, maintenance, total: capital + maintenance };
}

export function sortLedgerEntriesByDateDesc(
  entries: LedgerEntryRow[],
): LedgerEntryRow[] {
  return [...entries].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function groupLedgerEntriesByMonth(
  sortedEntries: LedgerEntryRow[],
  filter: LedgerDocumentFilter,
): Record<string, LedgerEntryRow[]> {
  const active = filterLedgerEntriesByDocumentFilter(
    sortedEntries as any,
    filter,
  );

  const groups: Record<string, LedgerEntryRow[]> = {};
  active.forEach((inv: any) => {
    const date = new Date(inv.created_at);
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(inv);
  });
  return groups;
}

export function groupedLedgerEntriesToSections(
  grouped: Record<string, LedgerEntryRow[]>,
): { title: string; data: LedgerEntryRow[] }[] {
  return Object.entries(grouped).map(([month, items]) => ({
    title: month,
    data: items,
  }));
}

export function scopeRowsForSellerPacket(scopeItems: ScopeRow[]): Array<{
  category: string;
  description: string;
  total_cost_min: number | null;
  total_cost_max: number | null;
}> {
  return scopeItems.map((s) => ({
    category: s.category ?? "",
    description: s.description ?? "",
    total_cost_min: s.total_cost_min,
    total_cost_max: s.total_cost_max,
  }));
}
