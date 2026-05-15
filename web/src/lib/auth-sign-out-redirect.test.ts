import { describe, it, expect } from "vitest";
import {
  isProtectedAppPath,
  loginPathAfterSignOut,
} from "./auth-sign-out-redirect";

describe("auth-sign-out-redirect", () => {
  it("detects protected paths", () => {
    expect(isProtectedAppPath("/dashboard")).toBe(true);
    expect(isProtectedAppPath("/dashboard/plan")).toBe(true);
    expect(isProtectedAppPath("/settings")).toBe(true);
    expect(isProtectedAppPath("/login")).toBe(false);
    expect(isProtectedAppPath("/")).toBe(false);
  });

  it("builds login redirect for protected routes", () => {
    const path = loginPathAfterSignOut("/dashboard/plan", "?tab=foo");
    expect(path).toMatch(/^\/login\?redirect=/);
    expect(decodeURIComponent(path!.split("redirect=")[1]!)).toBe(
      "/dashboard/plan?tab=foo",
    );
  });

  it("returns null for public routes", () => {
    expect(loginPathAfterSignOut("/", "")).toBeNull();
  });
});
