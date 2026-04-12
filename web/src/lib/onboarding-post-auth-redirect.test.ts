import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getOnboardingResumeIfPending,
  resolvePostLoginHref,
  consumeAuthCallbackRedirectHref,
} from "./onboarding-post-auth-redirect";

describe("onboarding-post-auth-redirect", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getOnboardingResumeIfPending", () => {
    it("returns null if no pending estimate", () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);
      expect(getOnboardingResumeIfPending()).toBeNull();
    });

    it("returns onboarding signup if valid estimate exists", () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(
        JSON.stringify({ summary: { total: 100 } }),
      );
      expect(getOnboardingResumeIfPending()).toBe("/onboarding/signup");
    });
  });

  describe("resolvePostLoginHref", () => {
    it("uses redirectParam if present", () => {
      expect(resolvePostLoginHref("/settings")).toBe("/settings");
    });

    it("falls back to dashboard if no param and no pending estimate", () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);
      expect(resolvePostLoginHref(null)).toBe("/dashboard");
    });
  });

  describe("consumeAuthCallbackRedirectHref", () => {
    it("uses stored redirect from sessionStorage", () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue("/settings");
      expect(consumeAuthCallbackRedirectHref()).toBe("/settings");
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        "bluprnt_auth_redirect",
      );
    });

    it("falls back to pending estimate if no stored redirect", () => {
      vi.mocked(sessionStorage.getItem).mockImplementation((key) => {
        if (key === "bluprnt_auth_redirect") return null;
        if (key === "bluprnt_pending_estimate")
          return JSON.stringify({ summary: {} });
        return null;
      });
      expect(consumeAuthCallbackRedirectHref()).toBe("/onboarding/signup");
    });

    it("defaults to dashboard if nothing is pending", () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);
      expect(consumeAuthCallbackRedirectHref()).toBe("/dashboard");
    });
  });
});
