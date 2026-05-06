import { renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOnboardingEstimation } from "./use-onboarding-estimation";

vi.mock("@/lib/supabase", () => ({
  invokeFunction: vi.fn(),
  isSupabaseConfigured: vi.fn(),
}));

import { invokeFunction, isSupabaseConfigured } from "@/lib/supabase";

const baseParams = {
  projectType: "Kitchen" as const,
  locationUnset: false,
  scopeDescription: "",
  photos: [],
  zipFromLocation: () => "94110",
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useOnboardingEstimation", () => {
  it("seeds an offline estimate when Supabase is not configured", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const { result } = renderHook(() => useOnboardingEstimation(baseParams));

    await act(async () => {
      await result.current.runPhotoToScope();
    });

    expect(result.current.estimate).not.toBeNull();
    expect(result.current.estimateError).toBeNull();
    expect(result.current.estimateLoading).toBe(false);
  });

  it("sets a friendly error message when photo-to-scope fails", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: { message: "Server is unreachable" } as never,
    });
    const { result } = renderHook(() => useOnboardingEstimation(baseParams));

    await act(async () => {
      await result.current.runPhotoToScope({ maxRetries: 0 });
    });

    expect(result.current.estimateError).toBeTruthy();
    expect(result.current.estimateLoading).toBe(false);
  });

  it("captures onboardingContextError when context fetch fails", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: { message: "Context lookup failed" } as never,
    });
    const { result } = renderHook(() => useOnboardingEstimation(baseParams));

    await act(async () => {
      await result.current.fetchOnboardingContext();
    });

    expect(result.current.onboardingContext).toBeNull();
    expect(result.current.onboardingContextError).toBe("Context lookup failed");
  });

  it("sets onboardingContext on success and clears prior error", async () => {
    vi.mocked(invokeFunction)
      .mockResolvedValueOnce({
        data: null,
        error: { message: "transient" } as never,
      })
      .mockResolvedValueOnce({
        data: {
          status_messages: ["Talking to vendors..."],
          market_bulletin: "Hot market",
          value_tips: ["Bigger windows!"],
        },
        error: null,
      });

    const { result } = renderHook(() => useOnboardingEstimation(baseParams));

    await act(async () => {
      await result.current.fetchOnboardingContext();
    });
    expect(result.current.onboardingContextError).toBe("transient");

    await act(async () => {
      await result.current.fetchOnboardingContext();
    });
    await waitFor(() => {
      expect(result.current.onboardingContext?.market_bulletin).toBe(
        "Hot market",
      );
    });
    expect(result.current.onboardingContextError).toBeNull();
  });

  it("falls back to a default error message when invokeFunction throws", async () => {
    vi.mocked(invokeFunction).mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useOnboardingEstimation(baseParams));

    await act(async () => {
      await result.current.fetchOnboardingContext();
    });

    expect(result.current.onboardingContextError).toBe("network down");
  });
});
