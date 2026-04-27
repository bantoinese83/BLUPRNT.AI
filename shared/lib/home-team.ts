import type { LedgerEntryRow } from "../types/database.ts";

export type Contractor = {
  name: string;
  total_billed: number;
  last_activity: string;
  project_ids: string[];
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
  };
};

/**
 * Derives a unique list of contractors ("The Home Team") from a user's ledger history.
 */
export function deriveHomeTeam(ledgerEntries: LedgerEntryRow[]): Contractor[] {
  const teamMap = new Map<string, Contractor>();

  for (const inv of ledgerEntries) {
    if (!inv.vendor_name) continue;

    const name = inv.vendor_name.trim();
    const existing = teamMap.get(name.toLowerCase());

    const total = inv.total || 0;
    const date = String(inv.issue_date || inv.created_at);

    if (existing) {
      existing.total_billed += total;
      if (
        new Date(date).getTime() > new Date(existing.last_activity).getTime()
      ) {
        existing.last_activity = date;
      }
      if (inv.project_id && !existing.project_ids.includes(inv.project_id)) {
        existing.project_ids.push(inv.project_id);
      }
      // Merge contact info if we found more in this record
      if (inv.vendor_contact_info) {
        existing.contact_info = {
          ...existing.contact_info,
          ...(inv.vendor_contact_info as object),
        };
      }
    } else {
      teamMap.set(name.toLowerCase(), {
        name,
        total_billed: total,
        last_activity: date,
        project_ids: inv.project_id ? [inv.project_id] : [],
        contact_info:
          (inv.vendor_contact_info as unknown as Contractor["contact_info"]) ||
          {},
      });
    }
  }

  return Array.from(teamMap.values()).sort(
    (a, b) => b.total_billed - a.total_billed,
  );
}
