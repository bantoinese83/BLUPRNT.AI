import { describe, it, expect, vi, beforeEach } from "vitest";
import { isSupabaseConfigured, invokeFunction, supabase } from "./supabase";

vi.mock("@shared/lib/supabase-client.js", () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  })),
  invokeSharedFunction: vi.fn(),
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
    it("calls invokeSharedFunction with correct params", async () => {
      const { invokeSharedFunction } =
        await import("@shared/lib/supabase-client.js");

      await invokeFunction("test-func", { body: { x: 1 } });

      expect(invokeSharedFunction).toHaveBeenCalledWith(
        supabase,
        "test-func",
        expect.objectContaining({ body: { x: 1 } }),
        expect.any(Object),
        2,
      );
    });

    it("supports custom retries", async () => {
      const { invokeSharedFunction } =
        await import("@shared/lib/supabase-client.js");

      await invokeFunction("test-func", {}, 5);

      expect(invokeSharedFunction).toHaveBeenCalledWith(
        supabase,
        "test-func",
        expect.any(Object),
        expect.any(Object),
        5,
      );
    });
  });
});
