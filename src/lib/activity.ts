import type { InvoiceRow, ProjectRow } from "@/types/database";
import type { ActivityEvent } from "@/components/dashboard/ActivityFeed";

/**
 * Generates dynamic activity events based on project and invoice data.
 */
export function generateActivityEvents(project: ProjectRow, invoices: InvoiceRow[]): ActivityEvent[] {
  const events: ActivityEvent[] = [
    ...invoices.slice(0, 5).map(inv => ({
      id: `inv-${inv.id}`,
      type: "upload" as const,
      title: "Invoice Uploaded",
      description: `${inv.vendor_name || 'Vendor'} invoice for $${inv.total?.toLocaleString()} was added.`,
      timestamp: inv.created_at,
    })),
    // Base achievement for project creation
    {
       id: `init-${project.id}`,
       type: "project_created" as const,
       title: "Project Initialized",
       description: `Blueprint for '${project.name}' was created with a $${project.estimated_min_total?.toLocaleString()} baseline.`,
       timestamp: project.created_at || new Date().toISOString(),
    }
  ];

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
