import { describe, it, expect } from "vitest";
import {
  hasValidOnboardingZip,
  onboardingZipCode,
  phaseIndexForStep,
  phaseIndexForOnboardingPath,
  ONBOARDING_PHASE_LABELS,
  loadingScreenMessages,
  estimateFallbackUserMessage,
  FALLBACK_REASON_CLIENT_TYPE_BENCHMARK,
} from "../constants/onboarding.ts";

describe("onboarding shared", () => {
  it("hasValidOnboardingZip accepts five digits", () => {
    expect(hasValidOnboardingZip("90210")).toBe(true);
    expect(hasValidOnboardingZip(" 90210 ")).toBe(true);
    expect(hasValidOnboardingZip("9021")).toBe(false);
    expect(hasValidOnboardingZip("902101")).toBe(false);
  });

  it("onboardingZipCode trims valid zip or returns up to five digits", () => {
    expect(onboardingZipCode("90210 ")).toBe("90210");
    expect(onboardingZipCode("902-10")).toBe("90210");
    expect(onboardingZipCode("90")).toBe("90");
  });

  it("phaseIndexForStep maps seven steps to three phases", () => {
    expect(phaseIndexForStep(0)).toBe(0);
    expect(phaseIndexForStep(3)).toBe(0);
    expect(phaseIndexForStep(4)).toBe(1);
    expect(phaseIndexForStep(5)).toBe(1);
    expect(phaseIndexForStep(6)).toBe(2);
  });

  it("phaseIndexForOnboardingPath resolves web routes", () => {
    expect(phaseIndexForOnboardingPath("/onboarding/type")).toBe(0);
    expect(phaseIndexForOnboardingPath("/onboarding/estimate")).toBe(1);
    expect(phaseIndexForOnboardingPath("/onboarding/signup")).toBe(2);
    expect(phaseIndexForOnboardingPath("/unknown")).toBe(0);
  });

  it("loadingScreenMessages includes zip when valid", () => {
    const withZip = loadingScreenMessages("Kitchen", "94107");
    expect(withZip.some((m) => m.includes("94107"))).toBe(true);
    const noZip = loadingScreenMessages(null, "");
    expect(noZip.some((m) => /remodels cost near you/i.test(m))).toBe(true);
  });

  it("keeps three phase labels in sync", () => {
    expect(ONBOARDING_PHASE_LABELS).toHaveLength(3);
  });

  describe("estimateFallbackUserMessage", () => {
    it("returns null when not using fallback", () => {
      expect(estimateFallbackUserMessage(false, null)).toBe(null);
    });

    it("returns benchmark message for client type reason", () => {
      expect(
        estimateFallbackUserMessage(
          true,
          FALLBACK_REASON_CLIENT_TYPE_BENCHMARK,
        ),
      ).toContain("broad benchmark");
    });

    it("returns generic fallback message for other reasons", () => {
      expect(estimateFallbackUserMessage(true, "some_other_reason")).toContain(
        "regional placeholder",
      );
    });
  });
});
