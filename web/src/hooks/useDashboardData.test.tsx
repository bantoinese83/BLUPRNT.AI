import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDashboardData } from "./useDashboardData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("@/lib/sentry", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: () => ({ pathname: "/dashboard", search: "" }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useDashboardData", () => {
  const mockNavigate = vi.fn();
  const mockUserId = "test-user-id";
  const originalSetTimeout = global.setTimeout;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    sessionStorage.clear();
    localStorage.clear();

    const originalLocation = window.location;
    delete (window as { location?: unknown }).location;
    (window as { location: unknown }).location = {
      ...originalLocation,
      pathname: "/dashboard",
      search: "",
    };

    vi.mocked(isSupabaseConfigured).mockReturnValue(true);

    vi.spyOn(global, "setTimeout").mockImplementation(function (
      fn: (args: void) => void,
      delay?: number,
    ) {
      if (delay === 1200) {
        fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }
      return originalSetTimeout(fn, delay);
    } as typeof setTimeout);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSupabaseQuery = (data: unknown = []) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: (v: unknown) => void) =>
      Promise.resolve({ data, error: null }).then(resolve),
  });

  it("stops loading early if Supabase is not configured", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 2000,
    });
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });

  it("redirects to login if no session exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);

    renderHook(() => useDashboardData(), { wrapper });

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining("/login?redirect="),
          expect.objectContaining({ replace: true }),
        );
      },
      { timeout: 5000 },
    );
  });

  it("updates from Supabase after initial fetch", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    } as never);

    const mockProjects = [{ id: "proj-new", name: "New Project" }];
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "projects") return mockSupabaseQuery(mockProjects);
      return mockSupabaseQuery([]);
    }) as unknown as typeof supabase.from);

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.projects).toContainEqual(
          expect.objectContaining({ id: "proj-new" }),
        );
        expect(result.current.loading).toBe(false);
      },
      { timeout: 5000 },
    );
  });

  it("sets loadError when the projects query fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
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
            error: { message: "upstream failure", code: "PGRST000" },
          }),
        };
      }
      return mockSupabaseQuery([]);
    }) as unknown as typeof supabase.from);

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.loadError).toBeTruthy();
        expect(result.current.projects).toEqual([]);
      },
      { timeout: 5000 },
    );
  });

  it("fetches related data when a project exists", async () => {
    const mockProjectId = "proj-123";
    const mockProjects = [{ id: mockProjectId, name: "Project 1" }];
    const mockScopes = [{ id: "scope-1", category: "Test" }];
    const mockInvoices = [{ id: "inv-1", vendor_name: "Vendor" }];
    const mockSub = { status: "active" };
    const mockPass = { id: "pass-1" };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    } as never);

    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "projects") return mockSupabaseQuery(mockProjects);
      if (table === "scope_items") return mockSupabaseQuery(mockScopes);
      if (table === "invoices") return mockSupabaseQuery(mockInvoices);
      if (table === "user_subscriptions") return mockSupabaseQuery(mockSub);
      if (table === "project_passes") return mockSupabaseQuery(mockPass);
      return mockSupabaseQuery([]);
    }) as unknown as typeof supabase.from);

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(
      () => {
        expect(result.current.project?.id).toBe(mockProjectId);
        expect(result.current.scopeItems).toEqual(mockScopes);
        expect(result.current.invoices).toEqual(mockInvoices);
        expect(result.current.spendByCategory).toEqual({});
        expect(result.current.isArchitect).toBe(true);
        expect(result.current.hasProjectPass).toBe(true);
      },
      { timeout: 5000 },
    );
  });

  it("persists project selection and invalidates dashboard query", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    } as never);

    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "user_preferences") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          upsert,
        };
      }
      return mockSupabaseQuery([]);
    }) as unknown as typeof supabase.from);

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleProjectSelect("proj-xyz");
    });

    expect(localStorage.getItem("bluprnt_project_id")).toBe("proj-xyz");
    expect(upsert).toHaveBeenCalled();
  });

  it("exposes load and clearLoadError", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    } as never);
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "user_preferences") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return mockSupabaseQuery([]);
    }) as unknown as typeof supabase.from);

    const { result } = renderHook(() => useDashboardData(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.clearLoadError();
      await result.current.load();
    });
  });
});
