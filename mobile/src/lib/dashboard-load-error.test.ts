import { describe, it, expect } from "vitest";
import { friendlyDashboardLoadError } from "./dashboard-load-error";

describe("friendlyDashboardLoadError", () => {
  it("returns default when err is empty", () => {
    expect(friendlyDashboardLoadError(null)).toMatch(/Try again/);
  });

  it("detects network failures", () => {
    expect(friendlyDashboardLoadError({ message: "Failed to fetch" })).toMatch(
      /internet/,
    );
  });

  it("detects rate limits", () => {
    expect(friendlyDashboardLoadError({ message: "429 too many" })).toMatch(
      /break/,
    );
  });

  it("detects auth failures", () => {
    expect(
      friendlyDashboardLoadError({ code: "PGRST301", message: "jwt bad" }),
    ).toMatch(/session/);
  });
});
