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
    it("calls supabase.functions.invoke with session token", async () => {
      const mockSession = { access_token: "mock-token" };
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await invokeFunction("test-func", {
        body: { foo: "bar" },
      });

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(supabase.functions.invoke).toHaveBeenCalledWith("test-func", {
        body: { foo: "bar" },
        headers: { Authorization: "Bearer mock-token" },
      });
      expect(result.data).toEqual({ success: true });
    });

    it("calls supabase.functions.invoke without session token if no session exists", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await invokeFunction("test-func");

      expect(supabase.functions.invoke).toHaveBeenCalledWith("test-func", {
        headers: {},
      });
    });

    it("merges custom headers with authorization header", async () => {
      const mockSession = { access_token: "mock-token" };
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      await invokeFunction("test-func", {
        headers: { "X-Custom": "value" },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith("test-func", {
        headers: {
          "X-Custom": "value",
          Authorization: "Bearer mock-token",
        },
      });
    });
  });
});
