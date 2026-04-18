import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { OnboardingProvider } from "./OnboardingProvider";
import { useOnboarding } from "@/hooks/use-onboarding";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    functions: { invoke: vi.fn() },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
  },
  isSupabaseConfigured: vi.fn(() => true),
  invokeFunction: vi.fn(),
}));

const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });
Object.defineProperty(window, "sessionStorage", { value: localStorageMock });

function wrapper({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}

describe("OnboardingProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("provides onboarding context with defaults", async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    await waitFor(() => {
      expect(result.current.projectType).toBeNull();
      expect(result.current.locationInput).toBe("");
    });
  });

  it("updates state and persists to localStorage", async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    await act(async () => {
      result.current.setProjectType("Kitchen");
      result.current.setLocationInput("90210");
    });

    expect(result.current.projectType).toBe("Kitchen");
    expect(result.current.locationInput).toBe("90210");

    expect(localStorage.getItem("bluprnt_onboarding_type")).toContain(
      "Kitchen",
    );
  });

  it("clears all onboarding state", async () => {
    const { result } = renderHook(() => useOnboarding(), { wrapper });

    await act(async () => {
      result.current.setProjectType("Bathroom");
      result.current.clearOnboarding();
    });

    expect(result.current.projectType).toBeNull();
    expect(localStorage.getItem("bluprnt_onboarding_type")).toBeNull();
  });
});
