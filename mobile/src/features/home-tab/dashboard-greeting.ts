/** Time-of-day salutation when there are no finance documents yet. */
export function getPeriodGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * First line: status or time greeting (+ first name when no docs yet).
 * Second line: friendly project framing (“Here’s your …”).
 */
export function buildDashboardHeaderLines(params: {
  invoicesLength: number;
  /** Invoices & quotes only — same basis as plan vs actual (excludes maintenance log). */
  capitalDocumentedTotal: number;
  estimatedMinTotal: number | null | undefined;
  firstName: string | null | undefined;
  projectDisplayName: string | null | undefined;
}): { line1: string; line2: string } {
  const {
    invoicesLength,
    capitalDocumentedTotal,
    estimatedMinTotal,
    firstName,
    projectDisplayName,
  } = params;

  const trimmedProject = projectDisplayName?.trim();
  const line2 =
    trimmedProject && trimmedProject.length > 0
      ? `Here's your ${trimmedProject}.`
      : "Here's your overview.";

  if (invoicesLength > 0) {
    return {
      line1: getDashboardGreeting({
        invoicesLength,
        capitalDocumentedTotal,
        estimatedMinTotal,
      }),
      line2,
    };
  }

  const period = getPeriodGreeting();
  const trimmedFirst = firstName?.trim();
  const line1 = trimmedFirst ? `${period}, ${trimmedFirst}` : period;

  return { line1, line2 };
}

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

  return getPeriodGreeting();
}
