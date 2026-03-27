import { describe, it, expect } from "vitest";
import { generateActivityEvents } from "./activity";

describe("generateActivityEvents", () => {
  const mockProject = {
    id: "proj-1",
    name: "Test Project",
    created_at: "2023-01-01T00:00:00Z",
    estimated_min_total: 1000,
  } as any;

  const mockInvoices = [
    {
      id: "1",
      vendor_name: "Vendor A",
      total: 500,
      created_at: "2023-01-02T00:00:00Z",
    },
    {
      id: "2",
      vendor_name: "Vendor B",
      total: 300,
      created_at: "2023-01-03T00:00:00Z",
    },
  ] as any;

  it("generates events and sorts them by timestamp descending", () => {
    const events = generateActivityEvents(mockProject, mockInvoices);

    expect(events.length).toBe(3); // 2 invoices + 1 project creation
    expect(events[0].id).toBe("inv-2");
    expect(events[1].id).toBe("inv-1");
    expect(events[2].id).toBe("init-proj-1");
  });

  it("handles empty invoices", () => {
    const events = generateActivityEvents(mockProject, []);
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("project_created");
  });

  it("handles missing project name or totals", () => {
    const minimalProject = { id: "p-min", name: "Min" } as any;
    const events = generateActivityEvents(minimalProject, []);
    expect(events[0].description).toContain("Blueprint for 'Min' was created");
    expect(events[0].description).not.toContain("baseline");
  });

  it("handles missing vendor name or invoice total", () => {
    const minimalInvoice = {
      id: "i-min",
      created_at: "2023-01-05T00:00:00Z",
    } as any;
    const events = generateActivityEvents(mockProject, [minimalInvoice]);
    expect(events[0].description).toContain("Vendor invoice");
    expect(events[0].description).toContain("unspecified amount");
  });

  it("limits to 5 invoices", () => {
    const manyInvoices = Array.from({ length: 10 }, (_, i) => ({
      id: `inv-${i}`,
      created_at: `2023-01-1${i}T00:00:00Z`,
    })) as any;
    const events = generateActivityEvents(mockProject, manyInvoices);
    // 5 invoices + 1 project creation
    expect(events.filter((e) => e.type === "upload").length).toBe(5);
  });
});
