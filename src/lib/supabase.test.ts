import { describe, it, expect } from "vitest";
import { isSupabaseConfigured } from "./supabase";

describe("supabase", () => {
  describe("isSupabaseConfigured", () => {
    it("returns a boolean", () => {
      expect(typeof isSupabaseConfigured()).toBe("boolean");
    });
  });
});
