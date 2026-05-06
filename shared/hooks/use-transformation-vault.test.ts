/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useTransformationVaultLogic,
  type GalleryItem,
} from "./use-transformation-vault";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_CONFIG } from "../constants/storage";

// Mock Supabase
const createSignedUrls = vi.fn();
const mockSupabase = {
  storage: {
    from: vi.fn().mockReturnValue({
      createSignedUrls,
    }),
  },
} as unknown as SupabaseClient;

describe("useTransformationVaultLogic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock response to prevent destructuring errors
    createSignedUrls.mockResolvedValue({ data: [], error: null });
  });

  it("groups before and after photos into sets correctly", async () => {
    const galleryItems: GalleryItem[] = [
      { id: "1", photo_type: "before", storage_path: "b1.jpg" } as GalleryItem,
      { id: "2", photo_type: "after", storage_path: "a1.jpg" } as GalleryItem,
      { id: "3", photo_type: "before", storage_path: "b2.jpg" } as GalleryItem,
    ];

    const { result } = renderHook(() =>
      useTransformationVaultLogic("p1", galleryItems, mockSupabase),
    );

    // Expect 3 sets: 1 complete, 1 with only before, 1 empty for adding
    expect(result.current.sets).toHaveLength(3);
    expect(result.current.sets[0]!.before?.id).toBe("1");
    expect(result.current.sets[0]!.after?.id).toBe("2");
    expect(result.current.sets[1]!.before?.id).toBe("3");
    expect(result.current.sets[1]!.after).toBeNull();
    expect(result.current.sets[2]!.before).toBeNull();
    expect(result.current.sets[2]!.after).toBeNull();
    // Wait for the deferred fetchSignedUrls effect to settle so its setState
    // doesn't fire after teardown (would throw "window is not defined").
    await waitFor(() => expect(createSignedUrls).toHaveBeenCalled());
  });

  it("handles empty gallery items correctly", async () => {
    const { result } = renderHook(() =>
      useTransformationVaultLogic("p1", [], mockSupabase),
    );

    // Should still have 1 empty set
    expect(result.current.sets).toHaveLength(1);
    expect(result.current.sets[0]!.before).toBeNull();
    expect(result.current.sets[0]!.after).toBeNull();
    // No signed URLs requested when there are no items, but still let
    // any microtasks flush before teardown.
    await Promise.resolve();
  });

  it("fetches signed URLs for items not in cache", async () => {
    const galleryItems: GalleryItem[] = [
      { id: "1", photo_type: "before", storage_path: "b1.jpg" } as GalleryItem,
    ];

    createSignedUrls.mockResolvedValue({
      data: [{ path: "b1.jpg", signedUrl: "https://signed.com/b1.jpg" }],
      error: null,
    });

    const { result } = renderHook(() =>
      useTransformationVaultLogic("p1", galleryItems, mockSupabase),
    );

    await waitFor(
      () => {
        expect(result.current.signedUrls["b1.jpg"]).toBe(
          "https://signed.com/b1.jpg",
        );
      },
      { timeout: 2000 },
    );

    expect(mockSupabase.storage.from).toHaveBeenCalledWith("project-photos");
    expect(createSignedUrls).toHaveBeenCalledWith(
      ["b1.jpg"],
      STORAGE_CONFIG.SIGNED_URL_EXPIRY,
    );
  });

  it("clears cache when projectId changes", async () => {
    const galleryItems: GalleryItem[] = [
      { id: "1", photo_type: "before", storage_path: "b1.jpg" } as GalleryItem,
    ];

    createSignedUrls.mockResolvedValue({
      data: [{ path: "b1.jpg", signedUrl: "https://signed.com/b1.jpg" }],
      error: null,
    });

    const { result, rerender } = renderHook(
      ({ pid, items }) => useTransformationVaultLogic(pid, items, mockSupabase),
      { initialProps: { pid: "p1", items: galleryItems } },
    );

    await waitFor(
      () => {
        expect(result.current.signedUrls["b1.jpg"]).toBeDefined();
      },
      { timeout: 2000 },
    );

    // Change PID
    rerender({ pid: "p2", items: galleryItems });

    expect(result.current.signedUrls).toEqual({});
  });

  it("surfaces storage error when createSignedUrls fails", async () => {
    const galleryItems: GalleryItem[] = [
      { id: "1", photo_type: "before", storage_path: "b1.jpg" } as GalleryItem,
    ];

    createSignedUrls.mockResolvedValue({
      data: null,
      error: { message: "not allowed" },
    });

    const { result } = renderHook(() =>
      useTransformationVaultLogic("p1", galleryItems, mockSupabase),
    );

    await waitFor(
      () => {
        expect(result.current.signedUrlsError).toBe("not allowed");
      },
      { timeout: 2000 },
    );
  });
});
