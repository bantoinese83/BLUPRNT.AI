import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardData } from "./useDashboardData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

describe("useDashboardData", () => {
  const mockNavigate = vi.fn();
  const mockUserId = "test-user-id";
  const originalSetTimeout = global.setTimeout;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    sessionStorage.clear();
    localStorage.clear();

    // Mock window.location
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: "/dashboard",
      search: "",
    } as any;

    vi.mocked(isSupabaseConfigured).mockReturnValue(true);

    // Bypass the 1.2s delay
    vi.spyOn(global, "setTimeout").mockImplementation(
      (fn: any, delay?: number) => {
        if (delay === 1200) {
          fn();
          return 0 as any;
        }
        return originalSetTimeout(fn, delay);
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSupabaseQuery = (data: any = []) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) =>
      Promise.resolve({ data, error: null }).then(resolve),
  });

  it("stops loading early if Supabase is not configured", async () => {
    (isSupabaseConfigured as any).mockReturnValue(false);
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 2000,
    });
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });

  it("redirects to login if no session exists", async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
    });

    renderHook(() => useDashboardData());

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining("/login?redirect="),
          expect.objectContaining({ replace: true }),
        );
      },
      { timeout: 2000 },
    );
  });

  it("updates from Supabase after initial fetch", async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    });

    const mockProjects = [{ id: "proj-new", name: "New Project" }];
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "projects") return mockSupabaseQuery(mockProjects);
      return mockSupabaseQuery([]);
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(
      () => {
        expect(result.current.projects).toContainEqual(
          expect.objectContaining({ id: "proj-new" }),
        );
        expect(result.current.loading).toBe(false);
      },
      { timeout: 2000 },
    );
  });

  it("fetches related data when a project exists", async () => {
    const mockProjectId = "proj-123";
    const mockProjects = [{ id: mockProjectId, name: "Project 1" }];
    const mockScopes = [{ id: "scope-1", category: "Test" }];
    const mockInvoices = [{ id: "inv-1", vendor_name: "Vendor" }];
    const mockSub = { status: "active" };
    const mockPass = { id: "pass-1" };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "projects") return mockSupabaseQuery(mockProjects);
      if (table === "scope_items") return mockSupabaseQuery(mockScopes);
      if (table === "invoices") return mockSupabaseQuery(mockInvoices);
      if (table === "user_subscriptions") return mockSupabaseQuery(mockSub);
      if (table === "project_passes") return mockSupabaseQuery(mockPass);
      return mockSupabaseQuery([]);
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(
      () => {
        expect(result.current.project?.id).toBe(mockProjectId);
        expect(result.current.scopeItems).toEqual(mockScopes);
        expect(result.current.invoices).toEqual(mockInvoices);
        expect(result.current.isArchitect).toBe(true);
        expect(result.current.hasProjectPass).toBe(true);
      },
      { timeout: 2000 },
    );
  });
});
