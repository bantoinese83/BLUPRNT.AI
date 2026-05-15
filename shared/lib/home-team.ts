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
  /** Ledger rows for this vendor that have an uploaded file */
  documents_count: number;
  /** Newest billed row with a file — used for thumbnail */
  preview_ledger_entry_id: string | null;
};

function normalizeVendorKey(name: string): string {
  let cleaned = name.toLowerCase().trim();
  if (cleaned.startsWith("the ")) {
    cleaned = cleaned.substring(4).trim();
  }
  cleaned = cleaned.replace(/\b(llc|inc|co|corp|ltd)\b\.?/g, "").trim();
  cleaned = cleaned
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || name.toLowerCase().trim();
}

/**
 * Derives a unique list of contractors ("The Home Team") from a user's ledger history.
 */
export function deriveHomeTeam(ledgerEntries: LedgerEntryRow[]): Contractor[] {
  const teamMap = new Map<string, Contractor>();

  for (const inv of ledgerEntries) {
    if (!inv.vendor_name) continue;

    const rawName = inv.vendor_name.trim();
    const normKey = normalizeVendorKey(rawName);
    const existing = teamMap.get(normKey);

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
      // Prefer capitalized/longer display name
      if (rawName.length > existing.name.length && /[A-Z]/.test(rawName)) {
        existing.name = rawName;
      }
      // Merge contact info if we found more in this record
      if (inv.vendor_contact_info) {
        existing.contact_info = {
          ...existing.contact_info,
          ...(inv.vendor_contact_info as object),
        };
      }
    } else {
      teamMap.set(normKey, {
        name: rawName,
        total_billed: total,
        last_activity: date,
        project_ids: inv.project_id ? [inv.project_id] : [],
        contact_info:
          (inv.vendor_contact_info as unknown as Contractor["contact_info"]) ||
          {},
        documents_count: 0,
        preview_ledger_entry_id: null,
      });
    }
  }

  const docCountByKey = new Map<string, number>();
  const previewByKey = new Map<string, { id: string; ms: number }>();

  for (const inv of ledgerEntries) {
    if (!inv.vendor_name || !inv.document_id) continue;
    const nk = normalizeVendorKey(inv.vendor_name.trim());
    if (!teamMap.has(nk)) continue;

    docCountByKey.set(nk, (docCountByKey.get(nk) ?? 0) + 1);

    const dateStr = String(inv.issue_date || inv.created_at);
    const ms = new Date(dateStr).getTime();
    const prev = previewByKey.get(nk);
    if (!prev || ms >= prev.ms) {
      previewByKey.set(nk, { id: inv.id, ms });
    }
  }

  return Array.from(teamMap.values())
    .map((c) => {
      const nk = normalizeVendorKey(c.name);
      const preview = previewByKey.get(nk);
      return {
        ...c,
        documents_count: docCountByKey.get(nk) ?? 0,
        preview_ledger_entry_id: preview?.id ?? null,
      };
    })
    .sort((a, b) => b.total_billed - a.total_billed);
}
