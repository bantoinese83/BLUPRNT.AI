/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWebDashboardProjectRealtime } from "./useWebDashboardProjectRealtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as supabaseLib from "@/lib/supabase";

vi.mock("@/lib/supabase", () => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };
  return {
    supabase: {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn(),
    },
    isSupabaseConfigured: vi.fn().mockReturnValue(true),
  };
});

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

  it("invalidates queries when a realtime event occurs", () => {
    const callbacks: (() => void)[] = [];
    const mockOn = vi
      .fn()
      .mockImplementation((_event: string, _filter: string, cb: () => void) => {
        callbacks.push(cb);
        return { on: mockOn, subscribe: vi.fn() };
      });

    vi.mocked(supabaseLib.supabase.channel).mockReturnValue({
      on: mockOn,
      subscribe: vi.fn(),
    } as any);

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useWebDashboardProjectRealtime("project-123"), {
      wrapper,
    });

    // We expect 3 subscriptions: projects, invoices, scope_items
    expect(callbacks.length).toBe(3);

    // Trigger each callback
    callbacks.forEach((cb) => cb());

    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });
});
