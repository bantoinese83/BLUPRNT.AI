import { describe, it, expect, vi, beforeEach } from "vitest";
import { onlineManager } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";

vi.mock("@react-native-community/netinfo", () => ({
  default: {
    addEventListener: vi.fn(),
  },
}));

vi.mock("./network-status", () => ({
  isNetworkReachable: vi.fn(),
}));

describe("query-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates retryDelay correctly", async () => {
    const { queryClient } = await import("./query-client");
    const retryDelay = queryClient.getDefaultOptions().queries?.retryDelay;
    if (typeof retryDelay === "function") {
      expect(retryDelay(0, new Error())).toBe(1000);
      expect(retryDelay(1, new Error())).toBe(2000);
      expect(retryDelay(4, new Error())).toBe(10000); // Maxes out at 10_000
    } else {
      throw new Error("retryDelay is not a function");
    }
  });

  it("registers onlineManager event listener", async () => {
    // Reset modules to re-evaluate the import and trigger the file-level side effects
    vi.resetModules();

    let setupFn: any;
    vi.spyOn(onlineManager, "setEventListener").mockImplementation((fn) => {
      setupFn = fn;
    });

    await import("./query-client");

    expect(onlineManager.setEventListener).toHaveBeenCalled();

    if (setupFn) {
      setupFn(vi.fn());
      expect(NetInfo.addEventListener).toHaveBeenCalled();
    }
  });
});
