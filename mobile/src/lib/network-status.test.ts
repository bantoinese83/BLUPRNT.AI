import { describe, it, expect } from "vitest";
import { isNetworkReachable } from "@/lib/network-status";
import type { NetInfoState } from "@react-native-community/netinfo";

function state(partial: Partial<NetInfoState>): NetInfoState {
  return {
    type: "unknown",
    isConnected: null,
    isInternetReachable: null,
    details: null,
    isWifiEnabled: null,
    ...partial,
  } as NetInfoState;
}

describe("isNetworkReachable", () => {
  it("is false when disconnected", () => {
    expect(isNetworkReachable(state({ isConnected: false }))).toBe(false);
  });

  it("is false when connected but internet explicitly unreachable", () => {
    expect(
      isNetworkReachable(
        state({ isConnected: true, isInternetReachable: false }),
      ),
    ).toBe(false);
  });

  it("is true when connected with unknown internet reachability", () => {
    expect(
      isNetworkReachable(
        state({ isConnected: true, isInternetReachable: null }),
      ),
    ).toBe(true);
  });

  it("is true when connection state is unknown (avoids false offline flash)", () => {
    expect(isNetworkReachable(state({ isConnected: null }))).toBe(true);
  });
});
