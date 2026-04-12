import type { InvoiceRow, ScopeRow } from "@shared/types/database";

export type InvoiceLedgerFilter = "all" | "capital" | "maintenance";

export function computeLedgerStats(invoices: InvoiceRow[]): {
  capital: number;
  maintenance: number;
  total: number;
} {
  const capital = invoices
    .filter((i) => {
      const type = (i.document_type || "invoice").toLowerCase();
      return type === "invoice" || type === "quote";
    })
    .reduce((s, i) => s + (i.total || 0), 0);

  const maintenance = invoices
    .filter((i) => {
      const type = (i.document_type || "").toLowerCase();
      return type === "warranty" || type === "permit";
    })
    .reduce((s, i) => s + (i.total || 0), 0);

  return { capital, maintenance, total: capital + maintenance };
}

export function sortInvoicesByDateDesc(invoices: InvoiceRow[]): InvoiceRow[] {
  return [...invoices].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function matchesFilter(inv: InvoiceRow, filter: InvoiceLedgerFilter): boolean {
  const type = (inv.document_type || "").toLowerCase();
  if (filter === "all") return true;
  if (filter === "capital") return type === "invoice" || type === "quote";
  return type === "warranty" || type === "permit";
}

export function groupInvoicesByMonth(
  sortedInvoices: InvoiceRow[],
  filter: InvoiceLedgerFilter,
): Record<string, InvoiceRow[]> {
  const active =
    filter === "all"
      ? sortedInvoices
      : sortedInvoices.filter((i) => matchesFilter(i, filter));

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
