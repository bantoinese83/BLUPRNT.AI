import type { InvoiceRow, ProjectRow } from "../types/database";

export type ActivityEvent = {
  id: string;
  type: "upload" | "status_change" | "project_created" | "goal_reached";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
};

/**
 * Generates dynamic activity events based on live project + invoice data.
 * Mirrors the web's src/lib/activity.ts implementation.
 */
export function generateActivityEvents(
  project: ProjectRow,
  invoices: InvoiceRow[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [
    // One event per recent invoice (up to 5)
    ...invoices.slice(0, 5).map((inv) => ({
      id: `inv-${inv.id}`,
      type: "upload" as const,
      title: "Invoice Uploaded",
      description: `${inv.vendor_name || "Vendor"} invoice for ${
        inv.total != null
          ? `$${inv.total.toLocaleString()}`
          : "an unspecified amount"
      } was added.`,
      timestamp: inv.created_at,
    })),
    // Base achievement for project creation
    {
      id: `init-${project.id}`,
      type: "project_created" as const,
      title: "Project Initialized",
      description: `Blueprint for '${project.name}' was created${
        project.estimated_min_total != null
          ? ` with a $${project.estimated_min_total.toLocaleString()} baseline`
          : ""
      }.`,
      timestamp: project.created_at || new Date().toISOString(),
    },
  ];

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Returns a human-readable relative time string.
 * e.g. "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(iso: string): string {
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "recently";
  }
}
