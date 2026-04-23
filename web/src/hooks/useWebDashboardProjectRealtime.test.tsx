import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWebDashboardProjectRealtime } from "./useWebDashboardProjectRealtime";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ReactNode } from "react";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useWebDashboardProjectRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to projects, invoices, and scope_items when activeProjectId is provided", () => {
    const projectId = "p123";
    renderHook(() => useWebDashboardProjectRealtime(projectId), { wrapper });

    expect(supabase.channel).toHaveBeenCalledWith(`project_sync:${projectId}`);
    expect(vi.mocked(supabase.channel("").on)).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ table: "projects" }),
      expect.any(Function),
    );
    expect(vi.mocked(supabase.channel("").on)).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ table: "invoices" }),
      expect.any(Function),
    );
    expect(vi.mocked(supabase.channel("").on)).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({ table: "scope_items" }),
      expect.any(Function),
    );
  });

  it("does nothing if no activeProjectId", () => {
    renderHook(() => useWebDashboardProjectRealtime(null), { wrapper });
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it("removes channel on unmount", () => {
    const { unmount } = renderHook(() => useWebDashboardProjectRealtime("p1"), {
      wrapper,
    });
    unmount();
    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it("skips if supabase not configured", () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    renderHook(() => useWebDashboardProjectRealtime("p1"), { wrapper });
    expect(supabase.channel).not.toHaveBeenCalled();
  });
});
