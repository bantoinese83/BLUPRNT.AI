import { describe, it, expect, vi, beforeEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMobileDashboardSnapshot } from "./fetch-dashboard-snapshot";
import { supabase, isSupabaseConfigured } from "./supabase";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock("./supabase", () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(),
}));

describe("fetchMobileDashboardSnapshot", () => {
  const userId = "user-1";
  const session = { user: { id: userId } };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  });

  it("returns configured false when Supabase is not configured", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const snap = await fetchMobileDashboardSnapshot();
    expect(snap.configured).toBe(false);
  });

  it("returns empty snapshot when there is no session", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
    const snap = await fetchMobileDashboardSnapshot();
    expect(snap.projects).toEqual([]);
    expect(snap.project).toBeNull();
  });

  it("returns loadError when projects query fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "user_preferences") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "boom", code: "PGRST301" },
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }) as unknown as typeof supabase.from);

    const snap = await fetchMobileDashboardSnapshot();
    expect(snap.loadError).toBeTruthy();
    expect(snap.projects).toEqual([]);
  });

  it("returns empty projects list when user has no projects", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "user_preferences") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }) as unknown as typeof supabase.from);

    const snap = await fetchMobileDashboardSnapshot();
    expect(snap.projects).toEqual([]);
    expect(snap.project).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });
});
