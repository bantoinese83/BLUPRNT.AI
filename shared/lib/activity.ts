import type { LedgerEntryRow, ProjectRow } from "../types/database.ts";

export type ActivityEvent = {
  id: string;
  type: "upload" | "status_change" | "project_created" | "goal_reached";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
};

/**
 * Generates dynamic activity events based on live project + ledger data.
 * Shared across Web and Mobile.
 */
export function generateActivityEvents(
  project: ProjectRow,
  ledgerEntries: LedgerEntryRow[],
): ActivityEvent[] {
  const events: ActivityEvent[] = [
    ...generateLedgerEntryUploadEvents(ledgerEntries),
    generateProjectInitializationEvent(project),
  ];

  return sortEventsByRecency(events);
}

/** Creates events for the 5 most recent ledger entry uploads. */
function generateLedgerEntryUploadEvents(
  ledgerEntries: LedgerEntryRow[],
): ActivityEvent[] {
  return (ledgerEntries ?? []).slice(0, 5).map((inv) => ({
    id: `inv-${inv.id}`,
    type: "upload" as const,
    title: "Document Uploaded",
    description: `${inv.vendor_name || "Vendor"} document for ${
      inv.total != null && Number.isFinite(inv.total)
        ? `$${inv.total.toLocaleString()}`
        : "an unspecified amount"
    } was added.`,
    timestamp: inv.created_at || new Date().toISOString(),
  }));
}

/** Creates a base achievement event for when the project was first started. */
function generateProjectInitializationEvent(
  project: ProjectRow,
): ActivityEvent {
  const baseline =
    project.estimated_min_total != null &&
    Number.isFinite(project.estimated_min_total)
      ? ` with a $${project.estimated_min_total.toLocaleString()} baseline`
      : "";

  return {
    id: `init-${project.id}`,
    type: "project_created" as const,
    title: "Project Initialized",
    description: `Blueprint for '${project.name || "Unnamed Project"}' was created${baseline}.`,
    timestamp: project.created_at || new Date().toISOString(),
  };
}

/** Sorts events descending (newest first) based on timestamp. */
function sortEventsByRecency(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort((a, b) => {
    const tA = new Date(a.timestamp).getTime() || 0;
    const tB = new Date(b.timestamp).getTime() || 0;
    return tB - tA;
  });
}

/**
 * Returns a human-readable relative time string.
 * e.g. "2 hours ago", "3 days ago", "just now"
 */
export function formatRelativeTime(iso: string): string {
  if (!iso) return "recently";
  try {
    const now = Date.now();
    const d = new Date(iso);
    const then = d.getTime();
    if (Number.isNaN(then)) return "recently";

    const diffMs = now - then;
    // If it's in the future (e.g. clock drift), just say "just now"
    if (diffMs < 0) return "just now";

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "recently";
  }
}
