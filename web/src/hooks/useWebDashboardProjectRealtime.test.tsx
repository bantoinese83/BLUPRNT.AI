import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWebDashboardProjectRealtime } from "./useWebDashboardProjectRealtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as supabaseLib from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: vi.fn().mockReturnValue(true),
}));

describe("useWebDashboardProjectRealtime", () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to channels when activeProjectId is provided", () => {
    const mockChannel = vi.mocked(supabaseLib.supabase.channel);

    renderHook(() => useWebDashboardProjectRealtime("project-123"), {
      wrapper,
    });

    expect(mockChannel).toHaveBeenCalledWith("project_sync:project-123");
  });

  it("does not subscribe if activeProjectId is null", () => {
    const mockChannel = vi.mocked(supabaseLib.supabase.channel);

    renderHook(() => useWebDashboardProjectRealtime(null), { wrapper });

    expect(mockChannel).not.toHaveBeenCalled();
  });

  it("removes channel on unmount", () => {
    const mockRemove = vi.mocked(supabaseLib.supabase.removeChannel);

    const { unmount } = renderHook(
      () => useWebDashboardProjectRealtime("project-123"),
      { wrapper },
    );
    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});
