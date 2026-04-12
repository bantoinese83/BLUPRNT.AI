import { describe, it, expect, vi, afterEach } from "vitest";
import { getDashboardGreeting } from "@/features/home-tab/dashboard-greeting";

describe("getDashboardGreeting", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns Budget reached when spend meets estimate", () => {
    expect(
      getDashboardGreeting({
        invoicesLength: 2,
        invoiceTotal: 100,
        estimatedMinTotal: 100,
      }),
    ).toBe("Budget reached");
  });

  it("returns document count when under budget", () => {
    expect(
      getDashboardGreeting({
        invoicesLength: 3,
        invoiceTotal: 50,
        estimatedMinTotal: 100,
      }),
    ).toBe("3 Documents tracked");
  });

  it("returns Good morning when no documents and morning hours", () => {
    vi.spyOn(Date.prototype, "getHours").mockReturnValue(9);
    expect(
      getDashboardGreeting({
        invoicesLength: 0,
        invoiceTotal: 0,
        estimatedMinTotal: null,
      }),
    ).toBe("Good morning");
  });
});
