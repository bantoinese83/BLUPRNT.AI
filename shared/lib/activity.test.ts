import { describe, it, expect, vi } from "vitest";
import { generateActivityEvents, formatRelativeTime } from "./activity";
import type { InvoiceRow, ProjectRow } from "../types/database.ts";

describe("activity shared logic", () => {
  describe("generateActivityEvents", () => {
    const mockProject = {
      id: "p1",
      name: "Test Project",
      estimated_min_total: 1000,
      created_at: new Date().toISOString(),
    } as ProjectRow;

    it("includes project initialization event", () => {
      const events = generateActivityEvents(mockProject, []);
      expect(events).toHaveLength(1);
      expect(events[0]!.type).toBe("project_created");
      expect(events[0]!.description).toContain("Test Project");
    });

    it("includes recent invoices (up to 5)", () => {
      const manyInvoices = Array(10)
        .fill(0)
        .map((_, i) => ({
          id: `i${i}`,
          vendor_name: `Vendor ${i}`,
          total: 100 * i,
          created_at: new Date().toISOString(),
        })) as InvoiceRow[];

      const events = generateActivityEvents(mockProject, manyInvoices);
      expect(events.filter((e) => e.type === "upload")).toHaveLength(5);
    });
  });

  describe("formatRelativeTime", () => {
    it("returns 'just now' for very recent times", () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now)).toBe("just now");
    });

    it("returns minutes ago", () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatRelativeTime(tenMinsAgo)).toBe("10m ago");
    });

    it("returns hours ago", () => {
      const twoHoursAgo = new Date(
        Date.now() - 2 * 60 * 60 * 1000,
      ).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
    });

    it("returns days ago", () => {
      const threeDaysAgo = new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
    });

    it("returns absolute date for times older than a week", () => {
      const longAgo = "2025-01-01T10:00:00Z";
      expect(formatRelativeTime(longAgo)).toBe("Jan 1");
    });

    it("handles invalid dates gracefully", () => {
      expect(formatRelativeTime("not-a-date")).toBe("recently");
      expect(formatRelativeTime("")).toBe("recently");
    });

    it("handles future dates as 'just now' (clock drift)", () => {
      const future = new Date(Date.now() + 10000).toISOString();
      expect(formatRelativeTime(future)).toBe("just now");
    });

    it("returns recently if string formatting fails", () => {
      const spy = vi
        .spyOn(Date.prototype, "toLocaleDateString")
        .mockImplementation(() => {
          throw new Error("fail");
        });
      expect(formatRelativeTime(new Date(0).toISOString())).toBe("recently");
      spy.mockRestore();
    });
  });
});
