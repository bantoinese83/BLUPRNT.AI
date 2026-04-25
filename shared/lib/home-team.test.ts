import { describe, it, expect } from "vitest";
import { deriveHomeTeam } from "./home-team.ts";
import type { InvoiceRow } from "../types/database.ts";

describe("deriveHomeTeam", () => {
  it("derives unique contractors with merged totals and contact info", () => {
    const mockInvoices: Partial<InvoiceRow>[] = [
      {
        vendor_name: "John Plumbing",
        total: 1000,
        issue_date: "2026-01-01",
        project_id: "p1",
        vendor_contact_info: { phone: "555-0101" },
      },
      {
        vendor_name: "john plumbing", // check case insensitivity
        total: 500,
        issue_date: "2026-02-01",
        project_id: "p1",
        vendor_contact_info: { email: "john@example.com" },
      },
      {
        vendor_name: "Electric Pro",
        total: 2000,
        issue_date: "2026-01-15",
        project_id: "p2",
      },
    ];

    const team = deriveHomeTeam(mockInvoices as InvoiceRow[]);

    expect(team).toHaveLength(2);

    const john = team.find((t) => t.name.toLowerCase() === "john plumbing");
    expect(john?.total_billed).toBe(1500);
    expect(john?.contact_info.phone).toBe("555-0101");
    expect(john?.contact_info.email).toBe("john@example.com");
    expect(john?.last_activity).toBe("2026-02-01");
    expect(john?.project_ids).toContain("p1");

    const electric = team.find((t) => t.name === "Electric Pro");
    expect(electric?.total_billed).toBe(2000);
    expect(team[0]!.name).toBe("Electric Pro"); // sorted by billed descending
  });

  it("returns empty array for empty input", () => {
    expect(deriveHomeTeam([])).toEqual([]);
  });
});
