import { describe, it, expect, vi, beforeEach } from "vitest";
import { addScopeItem, recalcProjectTotals } from "./scope-operations";
import type {
  SupabaseClient,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

const mockInsert = vi.fn();
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    insert: mockInsert,
  }),
  rpc: vi.fn(),
} as unknown as SupabaseClient;

const MOCK_SUCCESS: PostgrestSingleResponse<null> = {
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: "OK",
  success: true,
};

describe("scope-operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addScopeItem", () => {
    it("inserts a new scope item and calls recalcProjectTotals", async () => {
      const newItem = {
        category: "Kitchen",
        description: "New cabinets",
        phase: "Construction",
        cost: 1000,
        quantity: 2,
        unit: "ea",
      };

      mockInsert.mockResolvedValue(MOCK_SUCCESS);
      vi.mocked(mockSupabase.rpc).mockResolvedValue(MOCK_SUCCESS);

      await addScopeItem(mockSupabase, "p1", newItem);

      expect(mockSupabase.from).toHaveBeenCalledWith("scope_items");
      expect(mockInsert).toHaveBeenCalledWith({
        project_id: "p1",
        category: "Kitchen",
        description: "New cabinets",
        phase: "Construction",
        quantity: 2,
        unit: "ea",
        finish_tier: "mid",
        unit_cost_min: 1000,
        unit_cost_max: 1000,
        total_cost_min: 2000,
        total_cost_max: 2000,
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("recalc_project_totals", {
        p_id: "p1",
      });
    });

    it("throws an error if insert fails", async () => {
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: "Insert failed", details: "", hint: "", code: "500" },
        count: null,
        status: 500,
        statusText: "Error",
      } as unknown as PostgrestSingleResponse<null>);

      await expect(
        addScopeItem(mockSupabase, "p1", {
          category: "K",
          description: "D",
          phase: "P",
          cost: 1,
          quantity: 1,
          unit: "U",
        }),
      ).rejects.toThrow("Insert failed");
    });
  });

  describe("recalcProjectTotals", () => {
    it("calls the recalc_project_totals RPC", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue(MOCK_SUCCESS);
      await recalcProjectTotals(mockSupabase, "p1");
      expect(mockSupabase.rpc).toHaveBeenCalledWith("recalc_project_totals", {
        p_id: "p1",
      });
    });

    it("throws if the RPC fails", async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "RPC failed", details: "", hint: "", code: "500" },
        count: null,
        status: 500,
        statusText: "Error",
      } as unknown as PostgrestSingleResponse<null>);
      await expect(recalcProjectTotals(mockSupabase, "p1")).rejects.toThrow(
        "RPC failed",
      );
    });
  });
});
