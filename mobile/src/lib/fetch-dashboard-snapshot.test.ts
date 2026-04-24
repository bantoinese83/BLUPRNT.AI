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

  it("returns cached snapshot when projects query fails but cache exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
    const cached = {
      projects: [
        {
          id: "p1",
          name: "Kitchen",
          property_id: "prop-1",
          estimated_min_total: null,
          estimated_max_total: null,
          confidence_score: null,
          stage: "planning",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      project: {
        id: "p1",
        name: "Kitchen",
        property_id: "prop-1",
        estimated_min_total: null,
        estimated_max_total: null,
        confidence_score: null,
        stage: "planning",
        created_at: "2026-01-01T00:00:00Z",
      },
      scopeItems: [],
      invoices: [],
      spendByCategory: {},
      isArchitect: true,
      subscription: null,
      hasProjectPass: false,
    };
    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key: string) => {
      if (key === "bluprnt_project_id") return "p1";
      if (key === `bluprnt_dash_${userId}`) {
        return JSON.stringify(cached);
      }
      return null;
    });
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
            error: { message: "network", code: "PGRST301" },
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
    expect(snap.projects).toHaveLength(1);
    expect(snap.project?.id).toBe("p1");
    expect(snap.isArchitect).toBe(true);
  });

  it("populates galleryItems from database", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ id: "p1", name: "Kitchen" }],
            error: null,
          }),
        };
      }
      if (table === "project_gallery") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { id: "g1", photo_type: "before", storage_path: "path.jpg" },
            ],
            error: null,
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
    expect(snap.galleryItems).toHaveLength(1);
    expect(snap.galleryItems[0].id).toBe("g1");
  });
});
