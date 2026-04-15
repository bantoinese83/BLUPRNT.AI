import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchDashboardSnapshot } from "./fetch-dashboard-snapshot";
import { supabase, isSupabaseConfigured } from "./supabase";

vi.mock("./supabase", () => ({
  supabase: {
    auth: { getSession: vi.fn() },
    from: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(),
}));

describe("fetchDashboardSnapshot", () => {
  const userId = "user-1";
  const session = { user: { id: userId } };
  const dashCacheKey = `bluprnt_dash_${userId}`;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    delete (window as { location?: unknown }).location;
    (window as { location: Location }).location = {
      pathname: "/dashboard",
      search: "",
    } as Location;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns configured false when Supabase env is missing", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const snap = await fetchDashboardSnapshot();
    expect(snap.configured).toBe(false);
  });

  it("redirects to login when there is no session", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
    const snap = await fetchDashboardSnapshot();
    expect(snap.redirectToLogin).toContain("/dashboard");
  });

  it("uses custom currentPath for login redirect when unauthenticated", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
    const snap = await fetchDashboardSnapshot({
      currentPath: "/settings?tab=billing",
    });
    expect(snap.redirectToLogin).toContain("settings");
  });



  it("ignores malformed session cache JSON", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
    sessionStorage.setItem(dashCacheKey, "{not json");

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

    await expect(fetchDashboardSnapshot()).resolves.toBeDefined();
  });

  it("realigns stored project id when it no longer exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
    localStorage.setItem("bluprnt_project_id", "stale-id");

    const projectRow = {
      id: "proj-live",
      name: "P",
      property_id: "prop-1",
      estimated_min_total: 1,
      estimated_max_total: 2,
      confidence_score: 0.5,
      stage: "planning",
      created_at: "2024-01-01",
    };

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "user_preferences") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { last_active_project_id: "stale-id" },
            error: null,
          }),
        };
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [projectRow],
            error: null,
          }),
        };
      }
      if (table === "scope_items") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "invoices") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "user_subscriptions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === "project_passes") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }) as unknown as typeof supabase.from);

    const snap = await fetchDashboardSnapshot();
    expect(snap.project?.id).toBe("proj-live");
    // Snapshot returns the new project, but fetcher no longer writes to localStorage directly
    expect(localStorage.getItem("bluprnt_project_id")).toBe("stale-id");
  });

  it("returns loadError when projects query fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
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
    const snap = await fetchDashboardSnapshot();
    expect(snap.loadError).toBeTruthy();
    expect(snap.projects).toEqual([]);
  });

  it("returns empty snapshot when user has no projects", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);
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
    const snap = await fetchDashboardSnapshot();
    expect(snap.projects).toEqual([]);
    expect(snap.project).toBeNull();
  });

  it("loads scope, invoices, subscription when a project exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session },
    } as never);

    const projectRow = {
      id: "proj-1",
      name: "P",
      property_id: "prop-1",
      estimated_min_total: 1,
      estimated_max_total: 2,
      confidence_score: 0.5,
      stage: "planning",
      created_at: "2024-01-01",
    };

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "user_preferences") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { last_active_project_id: "proj-1" },
            error: null,
          }),
        };
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [projectRow],
            error: null,
          }),
        };
      }
      if (table === "scope_items") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "invoices") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ id: "inv-1", vendor_name: "V", total: 10 }],
            error: null,
          }),
        };
      }
      if (table === "user_subscriptions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { status: "active" },
            error: null,
          }),
        };
      }
      if (table === "project_passes") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === "invoice_line_items") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }) as unknown as typeof supabase.from);

    const snap = await fetchDashboardSnapshot();
    expect(snap.project?.id).toBe("proj-1");
    expect(snap.isArchitect).toBe(true);
    expect(snap.invoices).toHaveLength(1);
  });
});
