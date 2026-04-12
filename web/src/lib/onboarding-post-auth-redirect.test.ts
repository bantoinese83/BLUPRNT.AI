import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getOnboardingResumeIfPending,
  resolvePostLoginHref,
} from "./onboarding-post-auth-redirect";

describe("getOnboardingResumeIfPending", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns null when no pending estimate in sessionStorage", () => {
    expect(getOnboardingResumeIfPending()).toBeNull();
  });

  it("returns signup path when pending estimate has summary object", () => {
    sessionStorage.setItem(
      "bluprnt_pending_estimate",
      JSON.stringify({ summary: { min: 1, max: 2 } }),
    );
    expect(getOnboardingResumeIfPending()).toBe("/onboarding/signup");
  });

  it("returns null when JSON is invalid", () => {
    sessionStorage.setItem("bluprnt_pending_estimate", "not-json");
    expect(getOnboardingResumeIfPending()).toBeNull();
  });

  it("returns null when summary is missing", () => {
    sessionStorage.setItem(
      "bluprnt_pending_estimate",
      JSON.stringify({ other: true }),
    );
    expect(getOnboardingResumeIfPending()).toBeNull();
  });
});

describe("resolvePostLoginHref", () => {
  it("uses safe redirect when redirect param is present", () => {
    expect(resolvePostLoginHref("/dashboard")).toBe("/dashboard");
  });

  it("falls back to onboarding resume then dashboard", () => {
    sessionStorage.clear();
    expect(resolvePostLoginHref(undefined)).toBe("/dashboard");
    sessionStorage.setItem(
      "bluprnt_pending_estimate",
      JSON.stringify({ summary: { a: 1 } }),
    );
    expect(resolvePostLoginHref(undefined)).toBe("/onboarding/signup");
  });
});
