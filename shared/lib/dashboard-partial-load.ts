/**
 * User-facing summary when some dashboard queries succeed and others fail.
 */
export function partialDashboardLoadMessage(
  parts: {
    scopeFailed: boolean;
    invoicesFailed: boolean;
    subscriptionFailed: boolean;
    projectPassFailed: boolean;
  },
  options?: { variant?: "mobile" | "web" },
): string | null {
  const labels: string[] = [];
  if (parts.scopeFailed) labels.push("scope and estimates");
  if (parts.invoicesFailed) labels.push("documents");
  if (parts.subscriptionFailed) labels.push("plan status");
  if (parts.projectPassFailed) labels.push("project pass");
  if (labels.length === 0) return null;

  const list =
    labels.length === 1
      ? labels[0]
      : labels.length === 2
        ? `${labels[0]} and ${labels[1]}`
        : `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;

  const hint =
    options?.variant === "mobile"
      ? "Pull down to refresh or try again in a moment."
      : "Refresh the page or try again in a moment.";

  return `We couldn’t load ${list}. The rest of your dashboard may still be up to date — ${hint}`;
}
