import { describe, it, expect } from "vitest";
import { seoAbsoluteUrl } from "./seo-meta";

describe("seoAbsoluteUrl", () => {
  it("produces an absolute URL including the path", () => {
    const u = seoAbsoluteUrl("/login");
    expect(u).toMatch(/^https?:\/\//);
    expect(u).toContain("/login");
  });

  it("normalizes paths without a leading slash", () => {
    const u = seoAbsoluteUrl("terms");
    expect(u).toContain("/terms");
  });
});
