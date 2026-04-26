/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import posthog from "posthog-js";
import { captureEvent, setAnalyticsEnabled, identifyUser } from "./posthog";

vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  },
}));

describe("posthog utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("captures events when enabled", () => {
    localStorage.setItem("bluprnt_analytics_opt_in", "true");
    captureEvent("test_event", { foo: "bar" });
    expect(posthog.capture).toHaveBeenCalledWith("test_event", { foo: "bar" });
  });

  it("does not capture events when disabled", () => {
    localStorage.setItem("bluprnt_analytics_opt_in", "false");
    captureEvent("test_event");
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("toggles posthog capturing state", () => {
    setAnalyticsEnabled(true);
    expect(posthog.opt_in_capturing).toHaveBeenCalled();
    expect(localStorage.getItem("bluprnt_analytics_opt_in")).toBe("true");

    setAnalyticsEnabled(false);
    expect(posthog.opt_out_capturing).toHaveBeenCalled();
    expect(localStorage.getItem("bluprnt_analytics_opt_in")).toBe("false");
  });

  it("identifies user when enabled", () => {
    localStorage.setItem("bluprnt_analytics_opt_in", "true");
    identifyUser("u123", "test@example.com");
    expect(posthog.identify).toHaveBeenCalledWith("u123", {
      email: "test@example.com",
    });
  });

  it("does not identify user when disabled", () => {
    localStorage.setItem("bluprnt_analytics_opt_in", "false");
    identifyUser("u123");
    expect(posthog.identify).not.toHaveBeenCalled();
  });
});
