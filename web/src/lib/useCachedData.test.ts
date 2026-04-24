import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCachedData, resetCachedDataStoresForTests } from "./useCachedData";

describe("useCachedData", () => {
  beforeEach(() => {
    resetCachedDataStoresForTests();
  });

  it("fetches and returns data", async () => {
    const fetcher = vi.fn().mockResolvedValue("test-data");
    const { result } = renderHook(() =>
      useCachedData({ key: "test-key", fetcher }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBe(null);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBe("test-data");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("uses cached data immediately", async () => {
    const fetcher = vi.fn().mockResolvedValue("test-data");

    // First render to populate cache
    const { unmount } = renderHook(() =>
      useCachedData({ key: "test-key", fetcher }),
    );
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    unmount();

    // Second render should have data immediately
    const { result } = renderHook(() =>
      useCachedData({ key: "test-key", fetcher }),
    );

    expect(result.current.data).toBe("test-data");
    // It will still revalidate on mount by default
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it("handles fetch errors", async () => {
    const error = new Error("Fetch failed");
    const fetcher = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() =>
      useCachedData({ key: "test-key", fetcher }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBe(null);
  });

  it("respects revalidateOnMount=false", async () => {
    const fetcher = vi.fn().mockResolvedValue("test-data");

    // Populating cache
    const { unmount } = renderHook(() =>
      useCachedData({ key: "test-key", fetcher }),
    );
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    unmount();

    // Second render with revalidateOnMount: false
    const { result } = renderHook(() =>
      useCachedData({ key: "test-key", fetcher, revalidateOnMount: false }),
    );

    expect(result.current.data).toBe("test-data");
    // Should NOT have called fetcher again
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns null and not loading if key is null", () => {
    const fetcher = vi.fn();
    const { result } = renderHook(() => useCachedData({ key: null, fetcher }));

    expect(result.current.data).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
