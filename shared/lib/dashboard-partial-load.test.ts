import { describe, it, expect } from "vitest";
import { partialDashboardLoadMessage } from "./dashboard-partial-load.ts";

describe("partialDashboardLoadMessage", () => {
  it("returns null when nothing failed", () => {
    expect(
      partialDashboardLoadMessage({
        scopeFailed: false,
        ledgerEntriesFailed: false,
        subscriptionFailed: false,
        projectPassFailed: false,
        galleryFailed: false,
      }),
    ).toBeNull();
  });

  it("lists failed areas with mobile hint", () => {
    const msg = partialDashboardLoadMessage(
      {
        scopeFailed: true,
        ledgerEntriesFailed: true,
        subscriptionFailed: false,
        projectPassFailed: false,
        galleryFailed: false,
      },
      { variant: "mobile" },
    );
    expect(msg).toContain("scope and estimates");
    expect(msg).toContain("documents");
    expect(msg).toContain("Pull down to refresh");
  });
});
