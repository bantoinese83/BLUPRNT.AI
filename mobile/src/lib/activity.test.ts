import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateActivityEvents, formatRelativeTime } from "@/lib/activity";
import type { InvoiceRow, ProjectRow } from "@shared/types/database";

describe("generateActivityEvents", () => {
  const project = {
    id: "p1",
    name: "Kitchen",
    property_id: "prop",
    estimated_min_total: 5000,
    estimated_max_total: 8000,
    confidence_score: 0.5,
    stage: "active",
    created_at: "2024-06-01T12:00:00.000Z",
  } as unknown as ProjectRow;

  const invoice = {
    id: "i1",
    project_id: "p1",
    vendor_name: "ACME",
    total: 1200,
    created_at: "2024-06-02T12:00:00.000Z",
    payment_status: "paid",
    document_type: "invoice",
    document_id: null,
  } as unknown as InvoiceRow;

  it("includes invoice and project events sorted by time", () => {
    const events = generateActivityEvents(project, [invoice]);
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]!.timestamp >= events[events.length - 1]!.timestamp).toBe(
      true,
    );
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns just now for recent timestamps", () => {
    expect(formatRelativeTime("2024-06-10T11:59:30.000Z")).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(formatRelativeTime("2024-06-10T11:30:00.000Z")).toMatch(/m ago/);
  });

  it("returns hours ago", () => {
    expect(formatRelativeTime("2024-06-10T08:00:00.000Z")).toMatch(/h ago/);
  });

  it("returns days ago", () => {
    expect(formatRelativeTime("2024-06-07T12:00:00.000Z")).toMatch(/d ago/);
  });

  it("returns date string for older times", () => {
    expect(formatRelativeTime("2024-05-01T12:00:00.000Z")).toMatch(/May/);
  });
});
