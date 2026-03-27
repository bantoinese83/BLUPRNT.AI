import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScopeManagement } from "./useScopeManagement";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import confetti from "canvas-confetti";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("useScopeManagement", () => {
  const mockProjectId = "project-123";
  const mockOnRefresh = vi.fn();

  const mockSupabaseQuery = (data: any = [], error: any = null) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((callback) => {
        return Promise.resolve({ data, error }).then(callback);
      }),
    };
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (supabase.from as any).mockImplementation(() => mockSupabaseQuery());
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() =>
      useScopeManagement({
        projectId: mockProjectId,
        onRefresh: mockOnRefresh,
      }),
    );

    expect(result.current.editingId).toBe(null);
    expect(result.current.saving).toBe(false);
  });

  describe("handleSave", () => {
    it("recalculates unit costs and updates quantity with clamping", async () => {
      const mockChain = mockSupabaseQuery();
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "scope_items") return mockChain;
        return mockSupabaseQuery();
      });

      const { result } = renderHook(() =>
        useScopeManagement({
          projectId: mockProjectId,
          onRefresh: mockOnRefresh,
        }),
      );

      const mockItem = {
        id: "item-1",
        quantity: 1,
        finish_tier: "mid",
        unit_cost_min: 100,
        unit_cost_max: 200,
      } as any;

      act(() => {
        result.current.startEdit(mockItem);
        result.current.setEditQty("2000000"); // Should clamp to 1000000
        result.current.setEditTier("premium"); // 1.2 multiplier from mid (1.0)
      });

      await act(async () => {
        await result.current.handleSave(mockItem);
      });

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 1000000,
          finish_tier: "premium",
          unit_cost_min: 120, // 100 * (1.2 / 1.0)
          unit_cost_max: 240, // 200 * (1.2 / 1.0)
          total_cost_min: 120000000,
          total_cost_max: 240000000,
        }),
      );
      expect(mockOnRefresh).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it("triggers confetti only once", async () => {
      const { result } = renderHook(() =>
        useScopeManagement({
          projectId: mockProjectId,
          onRefresh: mockOnRefresh,
        }),
      );

      const mockItem = { id: "1", finish_tier: "mid" } as any;

      await act(async () => {
        await result.current.handleSave(mockItem);
      });
      expect(confetti).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.handleSave(mockItem);
      });
      expect(confetti).toHaveBeenCalledTimes(1); // Still 1
    });

    it("handles Supabase update error", async () => {
      const mockChain = mockSupabaseQuery(null, { message: "Update failed" });
      (supabase.from as any).mockReturnValue(mockChain);

      const { result } = renderHook(() =>
        useScopeManagement({
          projectId: mockProjectId,
          onRefresh: mockOnRefresh,
        }),
      );

      await act(async () => {
        await result.current.handleSave({ id: "1" } as any);
      });

      expect(result.current.error).toBe("Update failed");
      expect(toast.error).toHaveBeenCalledWith("Couldn't save changes");
    });
  });

  describe("confirmDelete", () => {
    it("deletes item and refreshes project", async () => {
      const mockChain = mockSupabaseQuery();
      (supabase.from as any).mockReturnValue(mockChain);

      const { result } = renderHook(() =>
        useScopeManagement({
          projectId: mockProjectId,
          onRefresh: mockOnRefresh,
        }),
      );

      act(() => {
        result.current.setDeleteConfirmItem({ id: "item-to-delete" } as any);
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(mockChain.delete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Item removed");
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    it("handles delete error", async () => {
      const mockChain = mockSupabaseQuery(null, { message: "Delete failed" });
      (supabase.from as any).mockReturnValue(mockChain);

      const { result } = renderHook(() =>
        useScopeManagement({
          projectId: mockProjectId,
          onRefresh: mockOnRefresh,
        }),
      );

      act(() => {
        result.current.setDeleteConfirmItem({ id: "item-to-delete" } as any);
      });

      await act(async () => {
        await result.current.confirmDelete();
      });

      expect(result.current.error).toBe("Delete failed");
      expect(toast.error).toHaveBeenCalledWith("Couldn't remove item");
    });
  });
});
