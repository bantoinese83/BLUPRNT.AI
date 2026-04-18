import type { InvoiceRow, ScopeRow } from "@shared/types/database";
import {
  capitalImprovementTotal,
  maintenanceDocumentTotal,
  filterInvoicesByLedgerDocumentFilter,
  type LedgerDocumentFilter,
} from "@shared/lib/plan-vs-actual";

export type InvoiceLedgerFilter = LedgerDocumentFilter;

export function computeLedgerStats(invoices: InvoiceRow[]): {
  capital: number;
  maintenance: number;
  total: number;
} {
  const capital = capitalImprovementTotal(invoices);
  const maintenance = maintenanceDocumentTotal(invoices);
  return { capital, maintenance, total: capital + maintenance };
}

export function sortInvoicesByDateDesc(invoices: InvoiceRow[]): InvoiceRow[] {
  return [...invoices].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function groupInvoicesByMonth(
  sortedInvoices: InvoiceRow[],
  filter: InvoiceLedgerFilter,
): Record<string, InvoiceRow[]> {
  const active = filterInvoicesByLedgerDocumentFilter(sortedInvoices, filter);

  const groups: Record<string, InvoiceRow[]> = {};
  active.forEach((inv) => {
    const date = new Date(inv.created_at);
    const key = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(inv);
  });
  return groups;
}

export function groupedInvoicesToSections(
  grouped: Record<string, InvoiceRow[]>,
): { title: string; data: InvoiceRow[] }[] {
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
