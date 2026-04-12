import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { OnboardingProvider } from "./OnboardingProvider";
import { useOnboarding } from "@/hooks/use-onboarding";

vi.mock("@/hooks/use-local-storage", () => ({
  useLocalStorage: vi.fn((_key: string, initialValue: unknown) => [
    initialValue,
    vi.fn(),
  ]),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    functions: { invoke: vi.fn() },
  },
  isSupabaseConfigured: vi.fn(() => false),
  invokeFunction: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}

describe("OnboardingProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("provides onboarding context with defaults", async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.projectType).toBeNull();
      expect(result.current.locationInput).toBe("");
      expect(typeof result.current.runPhotoToScope).toBe("function");
      expect(typeof result.current.clearOnboarding).toBe("function");
    });
  });
});
