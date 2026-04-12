import { describe, it, expect, vi } from "vitest";

vi.mock("@react-native-community/netinfo", () => ({
  default: {
    addEventListener: vi.fn(() => () => {}),
  },
}));

import { queryClient, dashboardQueryKey } from "@/lib/query-client";

describe("query-client", () => {
  it("exports configured client and dashboard key", () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(2);
    expect(queryClient.getDefaultOptions().queries?.refetchOnReconnect).toBe(
      true,
    );
    expect(dashboardQueryKey).toEqual(["dashboard", "snapshot", "mobile"]);
  });
});
