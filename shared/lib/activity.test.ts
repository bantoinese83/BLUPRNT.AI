import { describe, it, expect, vi } from "vitest";
import { generateActivityEvents, formatRelativeTime } from "./activity";

describe("activity shared logic", () => {
  describe("generateActivityEvents", () => {
    const mockProject = {
      id: "p1",
      name: "Kitchen Reno",
      created_at: "2026-04-20T10:00:00Z",
      estimated_min_total: 5000,
    } as any;

    const mockInvoices = [
      {
        id: "i1",
        vendor_name: "Tile Co",
        total: 200,
        created_at: "2026-04-21T10:00:00Z",
      },
      {
        id: "i2",
        vendor_name: "Cabinets Plus",
        total: 3000,
        created_at: "2026-04-22T10:00:00Z",
      },
    ] as any;

    it("includes project initialization and invoice uploads", () => {
      const events = generateActivityEvents(mockProject, mockInvoices);
      expect(events).toHaveLength(3);
      expect(events.find((e) => e.type === "project_created")).toBeDefined();
      expect(events.filter((e) => e.type === "upload")).toHaveLength(2);
    });

    it("sorts events by recency (newest first)", () => {
      const events = generateActivityEvents(mockProject, mockInvoices);
      expect(events[0].id).toBe("inv-i2"); // Apr 22
      expect(events[1].id).toBe("inv-i1"); // Apr 21
      expect(events[2].id).toBe("init-p1"); // Apr 20
    });

    it("limits invoice events to the 5 most recent", () => {
      const manyInvoices = Array.from({ length: 10 }, (_, i) => ({
        id: `i${i}`,
        created_at: `2026-04-${10 + i}T10:00:00Z`,
      })) as any;
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
  });
});
