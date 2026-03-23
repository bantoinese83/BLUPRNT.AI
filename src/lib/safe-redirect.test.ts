import { describe, it, expect } from "vitest";
import { getSafeRedirect } from "./safe-redirect";

describe("getSafeRedirect", () => {
  it("allows dashboard with query string", () => {
    expect(getSafeRedirect("/dashboard?session_id=cs_test_123")).toBe(
      "/dashboard?session_id=cs_test_123",
    );
  });

  it("allows nested dashboard path with query", () => {
    expect(getSafeRedirect("/dashboard/plan?x=1")).toBe("/dashboard/plan?x=1");
  });

  it("rejects open redirects", () => {
    expect(getSafeRedirect("https://evil.com")).toBe("/dashboard");
    expect(getSafeRedirect("//evil.com")).toBe("/dashboard");
  });

  it("rejects path traversal", () => {
    expect(getSafeRedirect("/dashboard/../login")).toBe("/dashboard");
  });

  it("allows settings and project paths", () => {
    expect(getSafeRedirect("/settings")).toBe("/settings");
    expect(getSafeRedirect("/project/abc-token")).toBe("/project/abc-token");
  });
});
