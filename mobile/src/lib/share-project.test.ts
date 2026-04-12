import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateProjectShareLink } from "@/lib/share-project";
import { supabase } from "@/lib/supabase";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("generateProjectShareLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok and url on success", async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as never);

    const r = await generateProjectShareLink("proj-1");
    expect(r.ok).toBe(true);
    expect(r.url).toContain("https://bluprnt.ai/project/");
  });

  it("returns message on insert error", async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: { message: "fail", code: "23505" },
      }),
    } as never);

    const r = await generateProjectShareLink("proj-1");
    expect(r.ok).toBe(false);
    expect(r.message).toBe("fail");
  });
});
