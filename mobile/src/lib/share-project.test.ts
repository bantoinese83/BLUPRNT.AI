import { describe, it, expect, vi, beforeEach } from "vitest";
import { Alert, Share } from "react-native";
import {
  generateProjectShareLink,
  presentProjectShareSheet,
} from "@/lib/share-project";
import { supabase } from "@/lib/supabase";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("react-native", () => ({
  Alert: {
    alert: vi.fn(),
  },
  Share: {
    share: vi.fn().mockResolvedValue({ action: "sharedAction" }),
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
    expect(r.url).toContain("https://www.bluprntai.com/project/");
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

describe("presentProjectShareSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls Share.share on success", async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    } as never);

    await presentProjectShareSheet({ id: "p1", name: "My Project" });
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "My Project",
        url: expect.stringContaining("https://www.bluprntai.com/project/"),
      }),
    );
  });

  it("alerts user on generation failure", async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi
        .fn()
        .mockResolvedValue({ error: { message: "denied", code: "403" } }),
    } as never);

    await presentProjectShareSheet({ id: "p1", name: "My Project" });
    expect(Alert.alert).toHaveBeenCalledWith(
      "Couldn’t share",
      expect.any(String),
    );
  });

  it("alerts user on exception", async () => {
    vi.mocked(supabase.from).mockImplementation(() => {
      throw new Error("crash");
    });

    await presentProjectShareSheet({ id: "p1", name: "My Project" });
    expect(Alert.alert).toHaveBeenCalledWith(
      "Couldn’t share",
      expect.any(String),
    );
  });
});
