import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getDashboardGreeting,
  buildDashboardHeaderLines,
  getPeriodGreeting,
} from "@/features/home-tab/dashboard-greeting";

describe("getDashboardGreeting", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns Budget reached when spend meets estimate", () => {
    expect(
      getDashboardGreeting({
        invoicesLength: 2,
        capitalDocumentedTotal: 100,
        estimatedMinTotal: 100,
      }),
    ).toBe("Budget reached");
  });

  it("returns document count when under budget", () => {
    expect(
      getDashboardGreeting({
        invoicesLength: 3,
        capitalDocumentedTotal: 50,
        estimatedMinTotal: 100,
      }),
    ).toBe("3 Documents tracked");
  });

  it("returns Good morning when no documents and morning hours", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(9);
    expect(
      getDashboardGreeting({
        invoicesLength: 0,
        capitalDocumentedTotal: 0,
        estimatedMinTotal: null,
      }),
    ).toBe("Good morning,");
  });
});

describe("buildDashboardHeaderLines", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pairs time greeting with first name and project line when no invoices", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(9);
    const { line1, line2 } = buildDashboardHeaderLines({
      invoicesLength: 0,
      capitalDocumentedTotal: 0,
      estimatedMinTotal: null,
      firstName: "Lauren",
      projectDisplayName: "Roof project",
    });
    expect(line1).toBe("Good morning, Lauren");
    expect(line2).toBe("Here's your Roof project.");
  });

  it("omits name when firstName is blank", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(14);
    const { line1, line2 } = buildDashboardHeaderLines({
      invoicesLength: 0,
      capitalDocumentedTotal: 0,
      estimatedMinTotal: null,
      firstName: null,
      projectDisplayName: "Kitchen",
    });
    expect(line1).toBe("Good afternoon,");
    expect(line2).toBe("Here's your Kitchen.");
  });

  it("uses document status on line1 when invoices exist", () => {
    const { line1, line2 } = buildDashboardHeaderLines({
      invoicesLength: 2,
      capitalDocumentedTotal: 50,
      estimatedMinTotal: 100,
      firstName: "Lauren",
      projectDisplayName: "Roof project",
    });
    expect(line1).toBe("2 Documents tracked");
    expect(line2).toBe("Here's your Roof project.");
  });

  it("falls back to overview when project name missing", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(20);
    const { line1, line2 } = buildDashboardHeaderLines({
      invoicesLength: 0,
      capitalDocumentedTotal: 0,
      estimatedMinTotal: null,
      firstName: "Alex",
      projectDisplayName: null,
    });
    expect(line1).toBe("Good evening, Alex");
    expect(line2).toBe("Here's your overview.");
  });
});

describe("getPeriodGreeting", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns Good evening in the late day", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(20);
    expect(getPeriodGreeting()).toBe("Good evening");
  });
});
