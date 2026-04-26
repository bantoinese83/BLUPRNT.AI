/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setDashboardWelcomeFlag,
  readDashboardWelcomeFlag,
  clearDashboardWelcomeFlag,
} from "./dashboard-welcome";

const KEY = "bluprnt_dashboard_welcome";

describe("dashboard-welcome", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("setDashboardWelcomeFlag stores the flag", () => {
    setDashboardWelcomeFlag();
    expect(sessionStorage.getItem(KEY)).toBe("1");
  });

  it("readDashboardWelcomeFlag returns true when set", () => {
    sessionStorage.setItem(KEY, "1");
    expect(readDashboardWelcomeFlag()).toBe(true);
  });

  it("readDashboardWelcomeFlag returns false when missing", () => {
    expect(readDashboardWelcomeFlag()).toBe(false);
  });

  it("clearDashboardWelcomeFlag removes the flag", () => {
    sessionStorage.setItem(KEY, "1");
    clearDashboardWelcomeFlag();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it("handles sessionStorage errors gracefully on read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readDashboardWelcomeFlag()).toBe(false);
  });

  it("handles sessionStorage errors gracefully on write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => setDashboardWelcomeFlag()).not.toThrow();
  });
});
