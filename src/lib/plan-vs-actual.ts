/**
 * Core loop: regional estimate vs documented capital spend, in plain language.
 */

export type InvoiceLike = {
  total: number | null;
  document_type?: string | null;
};

function fmtUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function capitalImprovementTotal(invoices: InvoiceLike[]): number {
  return invoices
    .filter((i) => {
      const t = (i.document_type ?? "invoice").toLowerCase();
      return t === "invoice" || t === "quote";
    })
    .reduce((s, i) => s + (i.total ?? 0), 0);
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
  if (estimatedMin == null && estimatedMax == null) {
    return {
      headline: "Add your estimate to see the full story",
      body: "Once you have a cost range, we compare it to invoices and quotes you upload—so you can explain the gap in one glance.",
      kind: "no_estimate",
    };
  }

  if (capitalTotal <= 0) {
    return {
      headline: "No documented spend yet",
      body: "Upload invoices and quotes to see how real numbers line up with your plan. That trail becomes your resale-ready record.",
      kind: "no_documents",
    };
  }

  let low = estimatedMin ?? estimatedMax ?? 0;
  let high = estimatedMax ?? estimatedMin ?? low;
  if (low > high) [low, high] = [high, low];

  if (capitalTotal >= low && capitalTotal <= high) {
    return {
      headline: "Within your estimate range",
      body: "Documented spend sits between your low and high benchmarks—easy to explain when someone asks how the project is tracking.",
      kind: "within",
    };
  }

  if (capitalTotal < low) {
    const gap = low - capitalTotal;
    return {
      headline: "Below your low estimate so far",
      body: `You’ve logged about ${fmtUsd(gap)} less than the low end of your range—often work still ahead, or costs not uploaded yet.`,
      kind: "below_min",
    };
  }

  const gap = capitalTotal - high;
  return {
    headline: "Above your high estimate",
    body: `Documented spend is about ${fmtUsd(gap)} over the top of your range—typical when scopes grow, materials upgrade, or the first plan didn’t capture everything.`,
    kind: "above_max",
  };
}

function estimateRangeLabel(
  estimatedMin: number | null,
  estimatedMax: number | null,
): string {
  if (estimatedMin == null && estimatedMax == null) return "—";
  if (estimatedMin != null && estimatedMax != null) {
    if (estimatedMin === estimatedMax) return fmtUsd(estimatedMin);
    return `${fmtUsd(estimatedMin)} – ${fmtUsd(estimatedMax)}`;
  }
  return fmtUsd(estimatedMin ?? estimatedMax ?? 0);
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
    `Documented capital (invoices & quotes): ${fmtUsd(capitalTotal)}`,
    `Summary: ${narrative.headline}`,
    narrative.body,
    "Note: Documented amounts reflect files you uploaded; they may not include every cash expense.",
  ];
}
