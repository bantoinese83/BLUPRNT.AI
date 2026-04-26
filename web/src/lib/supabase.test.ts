import { describe, it, expect, vi, beforeEach } from "vitest";
import { isSupabaseConfigured, invokeFunction, supabase } from "./supabase";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  })),
}));

describe("supabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isSupabaseConfigured", () => {
    it("returns a boolean", () => {
      expect(typeof isSupabaseConfigured()).toBe("boolean");
    });
  });

  describe("invokeFunction", () => {
    it("calls supabase.functions.invoke with API version header", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await invokeFunction("test-func", {
        body: { foo: "bar" },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith("test-func", {
        body: { foo: "bar" },
        headers: { "x-bluprnt-api-version": "2026-04-26" },
      });
      expect(result.data).toEqual({ success: true });
    });

    it("merges custom headers with version header", async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await invokeFunction("test-func", {
        headers: { "X-Custom": "value" },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith("test-func", {
        headers: {
          "X-Custom": "value",
          "x-bluprnt-api-version": "2026-04-26",
        },
      });
    });
  });
});
