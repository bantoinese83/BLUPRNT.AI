/** Headline line above the project / user name on the home dashboard. */
export function getDashboardGreeting(params: {
  invoicesLength: number;
  invoiceTotal: number;
  estimatedMinTotal: number | null | undefined;
}): string {
  const { invoicesLength, invoiceTotal, estimatedMinTotal } = params;

  if (invoicesLength > 0) {
    if (estimatedMinTotal != null && invoiceTotal >= estimatedMinTotal) {
      return "Budget reached";
    }
    return `${invoicesLength} Documents tracked`;
  }

  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
