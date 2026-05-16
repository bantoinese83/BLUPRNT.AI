/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePhysicalAssets } from "./use-physical-assets";

function createSupabaseMock() {
  const order = vi.fn().mockResolvedValue({ data: [], error: null });
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  return {
    from,
    storage: {
      from: vi.fn(() => ({
        createSignedUrls: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    _order: order,
  };
}

describe("usePhysicalAssets", () => {
  it("does not refetch in a loop when onError callback identity changes", async () => {
    const supabase = createSupabaseMock();
    const onErrorA = vi.fn();
    const onErrorB = vi.fn();

    const { rerender } = renderHook(
      ({ onError }) =>
        usePhysicalAssets({
          projectId: "proj-1",
          supabase: supabase as never,
          onError,
        }),
      { initialProps: { onError: onErrorA } },
    );

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    rerender({ onError: onErrorB });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});
