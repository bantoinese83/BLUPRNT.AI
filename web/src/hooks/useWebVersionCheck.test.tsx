import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useWebVersionCheck } from "./useWebVersionCheck";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(),
}));

describe("useWebVersionCheck", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.stubEnv("VITE_E2E", "");
    vi.stubEnv("VITE_APP_VERSION", "1.0.0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips when E2E flag is set", async () => {
    vi.stubEnv("VITE_E2E", "1");
    const { result } = renderHook(() => useWebVersionCheck());
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.isOutdated).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("skips when Supabase is not configured", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const { result } = renderHook(() => useWebVersionCheck());
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.isOutdated).toBe(false);
  });

  it("marks outdated when current version is below min", async () => {
    vi.stubEnv("VITE_APP_VERSION", "0.0.1");
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { value: "1.0.0" },
            error: null,
          }),
        }) as never,
    );

    const { result } = renderHook(() => useWebVersionCheck());
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.isOutdated).toBe(true);
  });

  it("does not mark outdated when current meets min", async () => {
    vi.stubEnv("VITE_APP_VERSION", "2.0.0");
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { value: '"1.0.0"' },
            error: null,
          }),
        }) as never,
    );

    const { result } = renderHook(() => useWebVersionCheck());
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.isOutdated).toBe(false);
  });

  it("treats missing config row as not outdated", async () => {
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }) as never,
    );

    const { result } = renderHook(() => useWebVersionCheck());
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.isOutdated).toBe(false);
  });

  it("treats fetch error as not outdated", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "nope" },
          }),
        }) as never,
    );

    const { result } = renderHook(() => useWebVersionCheck());
    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(result.current.isOutdated).toBe(false);
    warn.mockRestore();
  });
});
