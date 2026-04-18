/** Headline line above the project / user name on the home dashboard. */
export function getDashboardGreeting(params: {
  invoicesLength: number;
  /** Invoices & quotes only — same basis as plan vs actual (excludes maintenance log). */
  capitalDocumentedTotal: number;
  estimatedMinTotal: number | null | undefined;
}): string {
  const { invoicesLength, capitalDocumentedTotal, estimatedMinTotal } = params;

  if (invoicesLength > 0) {
    if (
      estimatedMinTotal != null &&
      capitalDocumentedTotal >= estimatedMinTotal
    ) {
      return "Budget reached";
    }
    return `${invoicesLength} Documents tracked`;
  }

  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
