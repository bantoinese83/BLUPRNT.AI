/**
 * Core loop: regional estimate vs documented capital spend, in plain language.
 * Shared across Web and Mobile.
 */

import { isPlanVsActualDocumentType } from "./infer-document-type.ts";
import { money } from "./formatters.ts";

export type LedgerEntryLike = {
  total: number | null;
  document_type?: string | null;
};

export function capitalImprovementTotal(entries: LedgerEntryLike[]): number {
  return (entries ?? []).reduce((s, i) => {
    const t = (i?.document_type ?? "invoice").toLowerCase();
    if (isPlanVsActualDocumentType(t)) {
      const val = i?.total != null && Number.isFinite(i.total) ? i.total : 0;
      return s + val;
    }
    return s;
  }, 0);
}

/**
 * Sums all non–plan-vs-actual documents (warranties, permits, records, other).
 * Shown in the "Records" side of the ledger, not the capital improvement track.
 */
export function maintenanceDocumentTotal(entries: LedgerEntryLike[]): number {
  return (entries ?? []).reduce((s, i) => {
    const t = (i?.document_type ?? "").toLowerCase();
    const isCapital = t ? isPlanVsActualDocumentType(t) : false;
    if (t && !isCapital) {
      const val = i?.total != null && Number.isFinite(i.total) ? i.total : 0;
      return s + val;
    }
    return s;
  }, 0);
}

export type LedgerDocumentFilter = "all" | "capital" | "maintenance";

export function filterLedgerEntriesByDocumentFilter<T extends LedgerEntryLike>(
  entries: T[],
  filter: LedgerDocumentFilter,
): T[] {
  if (filter === "all") return entries;
  if (filter === "capital") {
    return entries.filter((i) => {
      const t = (i.document_type ?? "invoice").toLowerCase();
      return isPlanVsActualDocumentType(t);
    });
  }
  return entries.filter((i) => {
    const t = (i.document_type ?? "invoice").toLowerCase();
    return !isPlanVsActualDocumentType(t);
  });
}

export type PlanVsActualKind =
  | "no_estimate"
  | "no_documents"
  | "within"
  | "below_min"
  | "above_max";

export function planVsActualNarrative(
  estimatedMin: number | null,
  estimatedMax: number | null,
  capitalTotal: number,
): {
  headline: string;
  body: string;
  kind: PlanVsActualKind;
} {
  const total = Math.max(0, capitalTotal);

  if (estimatedMin == null && estimatedMax == null) {
    return {
      headline: "Add your estimate to see the full story",
      body: "Once you have a cost range, we compare it to invoices, quotes, and receipts you upload—so you can explain the gap in one glance.",
      kind: "no_estimate",
    };
  }

  if (total <= 0) {
    return {
      headline: "No documented spend yet",
      body: "Upload invoices, quotes, or receipts to see how real numbers line up with your plan. That trail becomes your resale-ready record.",
      kind: "no_documents",
    };
  }

  let low = estimatedMin ?? estimatedMax ?? 0;
  let high = estimatedMax ?? estimatedMin ?? low;
  if (low > high) [low, high] = [high, low];

  if (total >= low && total <= high) {
    return {
      headline: "Within your estimate range",
      body: "Documented spend sits between your low and high benchmarks—easy to explain when someone asks how the project is tracking.",
      kind: "within",
    };
  }

  if (total < low) {
    const gap = low - total;
    return {
      headline: "Below your low estimate so far",
      body: `You’ve logged about ${money(gap)} less than the low end of your range—often work still ahead, or costs not uploaded yet.`,
      kind: "below_min",
    };
  }

  const gap = total - high;
  return {
    headline: "Above your high estimate",
    body: `Documented spend is about ${money(gap)} over the top of your range—typical when scopes grow, materials upgrade, or the first plan didn’t capture everything.`,
    kind: "above_max",
  };
}

function estimateRangeLabel(
  estimatedMin: number | null,
  estimatedMax: number | null,
): string {
  if (estimatedMin == null && estimatedMax == null) return "—";
  if (estimatedMin != null && estimatedMax != null) {
    const [low, high] =
      estimatedMin <= estimatedMax
        ? [estimatedMin, estimatedMax]
        : [estimatedMax, estimatedMin];
    if (low === high) return money(low);
    return `${money(low)} – ${money(high)}`;
  }
  return money(estimatedMin ?? estimatedMax ?? 0);
}

/** Short lines for PDF / print (no HTML). */
export function planVsActualPdfLines(
  estimatedMin: number | null,
  estimatedMax: number | null,
  capitalTotal: number,
): string[] {
  const narrative = planVsActualNarrative(
    estimatedMin,
    estimatedMax,
    capitalTotal,
  );

  return [
    `Estimated range (lifecycle): ${estimateRangeLabel(estimatedMin, estimatedMax)}`,
    `Documented capital (ledger records): ${money(capitalTotal)}`,
    `Summary: ${narrative.headline}`,
    narrative.body,
    "Note: Documented amounts reflect files you uploaded; they may not include every cash expense.",
  ];
}

/**
 * Calculates a midpoint estimate and the percentage of that midpoint
 * that has already been invested/spent.
 */
export function calculateBudgetStats(
  estimatedMin: number | null,
  estimatedMax: number | null,
  totalInvested: number,
) {
  // If both exist, use average. If one exists, use that one. If neither, 0.
  let estimatedMid = 0;
  if (estimatedMin != null && estimatedMax != null) {
    estimatedMid = (estimatedMin + estimatedMax) / 2;
  } else if (estimatedMin != null || estimatedMax != null) {
    estimatedMid = estimatedMin ?? estimatedMax ?? 0;
  }

  const budgetPct =
    estimatedMid > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((totalInvested / estimatedMid) * 100)),
        )
      : 0;

  const statusLabel =
    estimatedMax && totalInvested > estimatedMax
      ? "Over"
      : estimatedMin && totalInvested < estimatedMin
        ? "Under"
        : "Matched";

  return { estimatedMid, budgetPct, statusLabel };
}
