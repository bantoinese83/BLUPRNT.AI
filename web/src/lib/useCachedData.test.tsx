/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCachedData, resetCachedDataStoresForTests } from "./useCachedData";

describe("useCachedData", () => {
  beforeEach(() => {
    resetCachedDataStoresForTests();
  });

  it("returns idle state when key is null", async () => {
    const fetcher = vi.fn().mockResolvedValue("x");
    const { result } = renderHook(() => useCachedData({ key: null, fetcher }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches and caches data for a key", async () => {
    const key = `t-${Math.random()}`;
    const fetcher = vi.fn().mockResolvedValue({ hello: "world" });
    const { result } = renderHook(() =>
      useCachedData({ key, fetcher, revalidateOnMount: true }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual({ hello: "world" });
    expect(result.current.error).toBeNull();
  });

  it("surfaces fetch errors", async () => {
    const key = `err-${Math.random()}`;
    const err = new Error("network");
    const fetcher = vi.fn().mockRejectedValue(err);
    const { result } = renderHook(() => useCachedData({ key, fetcher }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(err);
    expect(result.current.data).toBeNull();
  });

  it("skips background revalidation when revalidateOnMount is false and cache is warm", async () => {
    const key = `swr-${Math.random()}`;
    let n = 0;
    const fetcher = vi.fn().mockImplementation(async () => {
      n += 1;
      return { n };
    });
    const { result, rerender } = renderHook(
      ({ rev }) => useCachedData({ key, fetcher, revalidateOnMount: rev }),
      { initialProps: { rev: true } },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetcher).toHaveBeenCalled();
    const firstN = (result.current.data as { n: number }).n;

    rerender({ rev: false });
    await waitFor(() => expect(result.current.data).toEqual({ n: firstN }));
  });

  it("reuses in-flight promise for the same key", async () => {
    const key = `shared-${Math.random()}`;
    let resolve!: (v: string) => void;
    const p = new Promise<string>((r) => {
      resolve = r;
    });
    const fetcher = vi.fn().mockReturnValue(p);

    const a = renderHook(() => useCachedData({ key, fetcher }));
    const b = renderHook(() => useCachedData({ key, fetcher }));

    expect(fetcher).toHaveBeenCalledTimes(1);
    resolve("done");
    await waitFor(() => expect(a.result.current.data).toBe("done"));
    await waitFor(() => expect(b.result.current.data).toBe("done"));
  });
});
