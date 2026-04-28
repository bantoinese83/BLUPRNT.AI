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

    // Expect random suffix in channel name
    expect(mockChannel).toHaveBeenCalledWith(
      expect.stringMatching(/^project_sync:project-123:[a-z0-9]+$/),
    );
  });

  it("does not subscribe if activeProjectId is null", () => {
    renderHook(() => useWebDashboardProjectRealtime(null), { wrapper });
    expect(supabaseLib.supabase.channel).not.toHaveBeenCalled();
  });

  it("removes channel on unmount", () => {
    const { unmount } = renderHook(
      () => useWebDashboardProjectRealtime("project-123"),
      { wrapper },
    );
    unmount();
    expect(supabaseLib.supabase.removeChannel).toHaveBeenCalled();
  });

  it("invalidates queries when a realtime event occurs (debounced)", async () => {
    vi.useFakeTimers();
    const refetchSpy = vi.spyOn(queryClient, "refetchQueries");
    const callbacks: ((payload: unknown) => void)[] = [];
    vi.mocked(supabaseLib.supabase.channel).mockReturnValue({
      on: vi.fn().mockImplementation((_event, _filter, callback) => {
        callbacks.push(callback);
        return supabaseLib.supabase.channel("");
      }),
      subscribe: vi.fn(),
    } as unknown as ReturnType<typeof supabaseLib.supabase.channel>);

    renderHook(() => useWebDashboardProjectRealtime("project-123"), {
      wrapper,
    });

    // We expect 4 subscriptions: projects, ledger_entries, scope_items, documents
    expect(callbacks.length).toBe(4);

    // Trigger each callback with a mock payload
    callbacks.forEach((cb) => cb({ eventType: "UPDATE" }));

    // Before timer advances, no refetch should have happened
    expect(refetchSpy).not.toHaveBeenCalled();

    // Advance timers by 100ms
    vi.advanceTimersByTime(100);

    // After timer advances, we expect exactly 1 refetch call due to debouncing
    expect(refetchSpy).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
