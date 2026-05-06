import { describe, expect, it } from "vitest";
import {
  collectUpcomingRenewals,
  renewalRelativeLabel,
  summarizeRenewals,
} from "./upcoming-renewals.ts";
import type { LedgerEntryRow } from "../types/database.ts";

const NOW = new Date("2026-05-05T12:00:00Z").getTime();

function row(id: string, fields: Partial<LedgerEntryRow>): LedgerEntryRow {
  return {
    id,
    project_id: "p1",
    vendor_name: null,
    total: 0,
    subtotal: null,
    tax_total: null,
    currency: "USD",
    document_type: "warranty",
    document_id: null,
    payment_status: "unknown",
    is_verified: true,
    issue_date: null,
    due_date: null,
    invoice_number: null,
    ai_summary: null,
    vendor_contact_info: null,
    owner_user_id: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    warranty_expiry_date: null,
    insurance_renewal_date: null,
    permit_expiration_date: null,
    warranty_notified_at: null,
    ...fields,
  } as LedgerEntryRow;
}

describe("collectUpcomingRenewals", () => {
  it("returns [] for no rows", () => {
    expect(collectUpcomingRenewals([], { nowMs: NOW })).toEqual([]);
    expect(collectUpcomingRenewals(null, { nowMs: NOW })).toEqual([]);
  });

  it("collapses warranty/insurance/permit dates into one feed", () => {
    const rows = [
      row("a", { warranty_expiry_date: "2026-06-04", vendor_name: "ACME" }),
      row("b", {
        insurance_renewal_date: "2026-05-10",
        vendor_name: "Carrier",
      }),
      row("c", {
        permit_expiration_date: "2026-04-25",
        vendor_name: "City",
      }),
    ];
    const items = collectUpcomingRenewals(rows, { nowMs: NOW });
    expect(items.map((i) => i.kind)).toEqual([
      "permit",
      "insurance",
      "warranty",
    ]);
    expect(items[0]?.urgency).toBe("expired");
    expect(items[1]?.urgency).toBe("soon");
    expect(items[2]?.urgency).toBe("soon");
  });

  it("classifies urgency by 30/90-day windows", () => {
    const rows = [
      row("expired", { warranty_expiry_date: "2026-04-01" }),
      row("soon", { warranty_expiry_date: "2026-05-25" }),
      row("upcoming", { warranty_expiry_date: "2026-07-01" }),
      row("future", { warranty_expiry_date: "2027-05-05" }),
    ];
    const items = collectUpcomingRenewals(rows, { nowMs: NOW });
    const byId = Object.fromEntries(
      items.map((i) => [i.ledgerEntryId, i.urgency]),
    );
    expect(byId.expired).toBe("expired");
    expect(byId.soon).toBe("soon");
    expect(byId.upcoming).toBe("upcoming");
    expect(byId.future).toBe("future");
  });

  it("respects maxDaysAhead and limit", () => {
    const rows = [
      row("a", { warranty_expiry_date: "2026-05-25" }),
      row("b", { warranty_expiry_date: "2026-08-01" }),
      row("c", { warranty_expiry_date: "2030-01-01" }),
    ];
    const items = collectUpcomingRenewals(rows, {
      nowMs: NOW,
      maxDaysAhead: 100,
      limit: 1,
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.ledgerEntryId).toBe("a");
  });

  it("ignores rows without any tracked date", () => {
    const rows = [row("none", { vendor_name: "Empty" })];
    expect(collectUpcomingRenewals(rows, { nowMs: NOW })).toEqual([]);
  });
});

describe("summarizeRenewals", () => {
  it("counts urgencies", () => {
    const rows = [
      row("a", { warranty_expiry_date: "2026-04-01" }),
      row("b", { warranty_expiry_date: "2026-05-25" }),
      row("c", { warranty_expiry_date: "2026-05-26" }),
      row("d", { warranty_expiry_date: "2026-07-01" }),
      row("e", { warranty_expiry_date: "2027-05-05" }),
    ];
    const items = collectUpcomingRenewals(rows, { nowMs: NOW });
    expect(summarizeRenewals(items)).toEqual({
      expired: 1,
      soon: 2,
      upcoming: 1,
      future: 1,
    });
  });
});

describe("renewalRelativeLabel", () => {
  it("describes today/tomorrow/overdue/future", () => {
    expect(renewalRelativeLabel(0)).toBe("due today");
    expect(renewalRelativeLabel(1)).toBe("tomorrow");
    expect(renewalRelativeLabel(-1)).toBe("1 day overdue");
    expect(renewalRelativeLabel(-7)).toBe("7 days overdue");
    expect(renewalRelativeLabel(45)).toBe("in 45 days");
    expect(renewalRelativeLabel(120)).toBe("in about 4 months");
    expect(renewalRelativeLabel(800)).toBe("in 2.2 years");
  });
});
