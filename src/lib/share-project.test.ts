import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateProjectShareLink } from "./share-project";
import { supabase, isSupabaseConfigured } from "./supabase";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
  isSupabaseConfigured: vi.fn(),
}));

describe("generateProjectShareLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("mock-uuid"),
      getRandomValues: vi.fn((bytes) => {
        for (let i = 0; i < bytes.length; i++) bytes[i] = i;
        return bytes;
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates share link successfully", async () => {
    (isSupabaseConfigured as any).mockReturnValue(true);
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const result = await generateProjectShareLink("project-123");

    expect(result.ok).toBe(true);
    expect(result.url).toBe("http://localhost:3000/project/mock-uuid");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "project-123",
        token: "mock-uuid",
      }),
    );
  });

  it("returns error if Supabase is not configured", async () => {
    (isSupabaseConfigured as any).mockReturnValue(false);

    const result = await generateProjectShareLink("project-123");

    expect(result.ok).toBe(false);
    expect(result.message).toBe("App isn't connected yet.");
  });

  it("handles Supabase insert error", async () => {
    (isSupabaseConfigured as any).mockReturnValue(true);
    const mockInsert = vi
      .fn()
      .mockResolvedValue({ error: { message: "Insert failed" } });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });

    const result = await generateProjectShareLink("project-123");

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Insert failed");
  });

  it("handles UUID generation fallback when randomUUID is undefined", async () => {
    (isSupabaseConfigured as any).mockReturnValue(true);
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    // Mock crypto without randomUUID
    vi.stubGlobal("crypto", {
      getRandomValues: vi.fn((bytes) => {
        for (let i = 0; i < bytes.length; i++) bytes[i] = i;
        return bytes;
      }),
    });

    const result = await generateProjectShareLink("project-123");

    expect(result.ok).toBe(true);
    // The fallback logic produces a specific UUID based on our deterministic getRandomValues
    // bytes 0-15: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
    // hex: 000102030405060708090a0b0c0d0e0f
    // bytes[6] = (bytes[6] & 0x0f) | 0x40; -> (6 & 0x0f) | 0x40 = 6 | 0x40 = 0x46 (70) -> hex '46'
    // bytes[8] = (bytes[8] & 0x3f) | 0x80; -> (8 & 0x3f) | 0x80 = 8 | 0x80 = 0x88 (136) -> hex '88'
    // Resulting hex: 000102030405460788090a0b0c0d0e0f
    // Formatted: 00010203-0405-4607-8809-0a0b0c0d0e0f (Wait, slice indices in code: 0-8, 8-12, 12-16, 16-20, 20-32)
    // hex 000102030405460788090a0b0c0d0e0f
    // 0-8: 00010203
    // 8-12: 0405
    // 12-16: 4607
    // 16-20: 8809
    // 20-32: 0a0b0c0d0e0f
    // Expected: 00010203-0405-4607-8809-0a0b0c0d0e0f
    expect(result.url).toBe(
      "http://localhost:3000/project/00010203-0405-4607-8809-0a0b0c0d0e0f",
    );
  });

  it("handles UUID generation fallback when crypto is undefined", async () => {
    (isSupabaseConfigured as any).mockReturnValue(true);
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.stubGlobal("crypto", undefined);
    vi.spyOn(Math, "random").mockReturnValue(0.5); // Math.floor(0.5 * 256) = 128 (0x80)

    const result = await generateProjectShareLink("project-123");

    expect(result.ok).toBe(true);
    // All bytes will be 128 (0x80)
    // bytes[6] = (0x80 & 0x0f) | 0x40 = 0 | 0x40 = 0x40
    // bytes[8] = (0x80 & 0x3f) | 0x80 = 0 | 0x80 = 0x80
    // hex: 80808080808040808080808080808080
    // Expected: 80808080-8080-4080-8080-808080808080
    expect(result.url).toBe(
      "http://localhost:3000/project/80808080-8080-4080-8080-808080808080",
    );
    vi.restoreAllMocks();
  });

  it("handles environment without window", async () => {
    (isSupabaseConfigured as any).mockReturnValue(true);
    (supabase.from as any).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.stubGlobal("window", undefined);

    const result = await generateProjectShareLink("project-123");

    expect(result.ok).toBe(true);
    expect(result.url).toBe("/project/mock-uuid");
  });
});
