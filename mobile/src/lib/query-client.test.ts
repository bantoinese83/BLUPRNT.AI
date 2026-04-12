import { describe, it, expect } from "vitest";
import { queryClient, dashboardQueryKey } from "@/lib/query-client";

describe("query-client", () => {
  it("exports configured client and dashboard key", () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
    expect(dashboardQueryKey).toEqual(["dashboard", "snapshot", "mobile"]);
  });
});
