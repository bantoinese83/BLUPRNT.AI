import { describe, it, expect } from "vitest";
import { friendlyDashboardLoadError } from "./dashboard-load-error";

describe("friendlyDashboardLoadError", () => {
  it("maps network-style messages", () => {
    expect(
      friendlyDashboardLoadError({ message: "TypeError: Failed to fetch" }),
    ).toContain("internet");
  });

  it("maps jwt hints", () => {
    expect(friendlyDashboardLoadError({ message: "JWT expired" })).toContain(
      "session",
    );
  });

  it("maps rate limit hints", () => {
    expect(
      friendlyDashboardLoadError({ message: "429 Too Many Requests" }),
    ).toMatch(/fast|break/i);
  });
});
