/**
 * Aggregates upcoming/expired date-bound items from the ledger
 * (warranties, insurance renewals, permit expirations).
 *
 * Pure, framework-free; consumed by both web and mobile dashboards.
 */
import type { LedgerEntryRow } from "../types/database.ts";

/** What kind of date this row represents in the renewal feed. */
export type RenewalKind = "warranty" | "insurance" | "permit";

export type RenewalUrgency = "expired" | "soon" | "upcoming" | "future";

export type UpcomingRenewal = {
  ledgerEntryId: string;
  documentId: string | null;
  vendorName: string | null;
  kind: RenewalKind;
  /** ISO date string (YYYY-MM-DD or full ISO) the renewal/expiry is due. */
  dueDate: string;
  /** Whole days from `now` to `dueDate`; negative when expired. */
  daysUntil: number;
  urgency: RenewalUrgency;
  /** Short human label for the renewal kind. */
  label: string;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const KIND_LABEL: Record<RenewalKind, string> = {
  warranty: "Warranty",
  insurance: "Insurance",
  permit: "Permit",
};

function classifyUrgency(daysUntil: number): RenewalUrgency {
  if (daysUntil < 0) return "expired";
  if (daysUntil <= 30) return "soon";
  if (daysUntil <= 90) return "upcoming";
  return "future";
}

function diffDays(dueIso: string, now: number): number {
  const due = new Date(dueIso).getTime();
  if (!Number.isFinite(due)) return Number.POSITIVE_INFINITY;
  return Math.ceil((due - now) / MS_PER_DAY);
}

type LedgerSubset = Pick<
  LedgerEntryRow,
  | "id"
  | "vendor_name"
  | "document_id"
  | "warranty_expiry_date"
  | "insurance_renewal_date"
  | "permit_expiration_date"
>;

export type UpcomingRenewalsOptions = {
  /** Override `Date.now()` for tests. */
  nowMs?: number;
  /** Ignore items further out than this many days (default: no limit). */
  maxDaysAhead?: number;
  /** Cap returned items (after sorting). Default: no cap. */
  limit?: number;
};

/**
 * Builds a sorted list of upcoming/expired renewals from ledger rows.
 *
 * Sort order: expired first (most overdue first), then soonest upcoming.
 */
export function collectUpcomingRenewals(
  rows: readonly LedgerSubset[] | null | undefined,
  options: UpcomingRenewalsOptions = {},
): UpcomingRenewal[] {
  if (!rows || rows.length === 0) return [];
  const now = options.nowMs ?? Date.now();
  const max = options.maxDaysAhead;

  const items: UpcomingRenewal[] = [];

  const push = (
    row: LedgerSubset,
    kind: RenewalKind,
    dueDate: string | null | undefined,
  ) => {
    if (!dueDate) return;
    const daysUntil = diffDays(dueDate, now);
    if (!Number.isFinite(daysUntil)) return;
    if (typeof max === "number" && daysUntil > max) return;
    items.push({
      ledgerEntryId: row.id,
      documentId: row.document_id ?? null,
      vendorName: row.vendor_name ?? null,
      kind,
      dueDate,
      daysUntil,
      urgency: classifyUrgency(daysUntil),
      label: KIND_LABEL[kind],
    });
  };

  for (const row of rows) {
    push(row, "warranty", row.warranty_expiry_date);
    push(row, "insurance", row.insurance_renewal_date);
    push(row, "permit", row.permit_expiration_date);
  }

  items.sort((a, b) => a.daysUntil - b.daysUntil);

  if (typeof options.limit === "number" && options.limit >= 0) {
    return items.slice(0, options.limit);
  }
  return items;
}

/** Counts grouped by urgency — handy for dashboard badges. */
export function summarizeRenewals(
  items: readonly UpcomingRenewal[],
): Record<RenewalUrgency, number> {
  const out: Record<RenewalUrgency, number> = {
    expired: 0,
    soon: 0,
    upcoming: 0,
    future: 0,
  };
  for (const r of items) out[r.urgency] += 1;
  return out;
}

/** Friendly status label like "in 12 days" / "21 days overdue" / "today". */
export function renewalRelativeLabel(daysUntil: number): string {
  if (daysUntil === 0) return "due today";
  if (daysUntil === 1) return "tomorrow";
  if (daysUntil === -1) return "1 day overdue";
  if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
  if (daysUntil <= 60) return `in ${daysUntil} days`;
  if (daysUntil <= 365) return `in about ${Math.round(daysUntil / 30)} months`;
  const years = (daysUntil / 365).toFixed(1);
  return `in ${years} years`;
}
