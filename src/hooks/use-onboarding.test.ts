import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useOnboarding } from "./use-onboarding";
import { OnboardingContext } from "@/contexts/onboarding-context";
import React from "react";

describe("useOnboarding", () => {
  it("should return context value when used within OnboardingProvider", () => {
    const mockValue = {
      state: { step: 1 },
      dispatch: () => {},
    } as any;

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        OnboardingContext.Provider,
        { value: mockValue },
        children,
      );

    const { result } = renderHook(() => useOnboarding(), { wrapper });

    expect(result.current).toBe(mockValue);
  });

  it("should throw error when used outside OnboardingProvider", () => {
    // Suppress console.error for this test as we expect an error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useOnboarding())).toThrow(
      "useOnboarding must be used within OnboardingProvider",
    );

    consoleSpy.mockRestore();
  });
});
