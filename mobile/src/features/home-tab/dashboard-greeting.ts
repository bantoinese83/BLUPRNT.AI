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
  ledgerEntriesLength: number;
  /** Invoices & quotes only — same basis as plan vs actual (excludes maintenance log). */
  capitalDocumentedTotal: number;
  estimatedMinTotal: number | null | undefined;
  firstName: string | null | undefined;
  projectDisplayName: string | null | undefined;
}): { line1: string; line2: string } {
  const {
    ledgerEntriesLength,
    capitalDocumentedTotal,
    estimatedMinTotal,
    firstName,
    projectDisplayName,
  } = params;

  const trimmedProject = projectDisplayName?.trim();
  // Strip a leading possessive "my " so the greeting doesn't read
  // "Here's your My project." when the user named it "My project".
  const greetingProject = trimmedProject?.replace(/^my\s+/i, "") ?? "";
  const line2 =
    greetingProject.length > 0
      ? `Here's your ${greetingProject}.`
      : "Here's your overview.";

  if (ledgerEntriesLength > 0) {
    return {
      line1: getDashboardGreeting({
        ledgerEntriesLength,
        capitalDocumentedTotal,
        estimatedMinTotal,
      }),
      line2,
    };
  }

  const period = getPeriodGreeting();
  const trimmedFirst = firstName?.trim();
  const line1 = trimmedFirst ? `${period}, ${trimmedFirst}` : `${period},`;

  return { line1, line2 };
}

export function getDashboardGreeting(params: {
  ledgerEntriesLength: number;
  /** Invoices & quotes only — same basis as plan vs actual (excludes maintenance log). */
  capitalDocumentedTotal: number;
  estimatedMinTotal: number | null | undefined;
}): string {
  const { ledgerEntriesLength, capitalDocumentedTotal, estimatedMinTotal } =
    params;

  if (ledgerEntriesLength > 0) {
    if (
      estimatedMinTotal != null &&
      capitalDocumentedTotal >= estimatedMinTotal
    ) {
      return "Budget reached";
    }
    return `${ledgerEntriesLength} Documents tracked`;
  }

  return `${getPeriodGreeting()},`;
}
