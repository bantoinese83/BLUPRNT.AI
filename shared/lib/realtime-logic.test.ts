import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupProjectDashboardRealtime } from "./realtime-logic.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase.gen.ts";

describe("setupProjectDashboardRealtime", () => {
  const mockProjectId = "proj-123";
  const mockChannelPrefix = "test_sync";

  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  const mockSupabase = {
    channel: vi.fn().mockReturnValue(mockChannel),
  } as unknown as SupabaseClient<Database>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a channel with the correct prefix and project ID", () => {
    setupProjectDashboardRealtime(mockSupabase, {
      projectId: mockProjectId,
      channelPrefix: mockChannelPrefix,
      onUpdate: () => {},
    });

    // Check that channel was called with expected prefix:projectId:random
    expect(mockSupabase.channel).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`^${mockChannelPrefix}:${mockProjectId}:[a-z0-9]+$`),
      ),
    );
  });

  it("subscribes to the correct tables with the correct filters", () => {
    setupProjectDashboardRealtime(mockSupabase, {
      projectId: mockProjectId,
      channelPrefix: mockChannelPrefix,
      onUpdate: () => {},
    });

    // projects table
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        table: "projects",
        filter: `id=eq.${mockProjectId}`,
      }),
      expect.any(Function),
    );

    // ledger_entries table
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        table: "ledger_entries",
        filter: `project_id=eq.${mockProjectId}`,
      }),
      expect.any(Function),
    );

    // scope_items table
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        table: "scope_items",
        filter: `project_id=eq.${mockProjectId}`,
      }),
      expect.any(Function),
    );

    // documents table
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        table: "documents",
        filter: `project_id=eq.${mockProjectId}`,
      }),
      expect.any(Function),
    );
  });

  it("calls onUpdate with correct arguments when a change occurs", () => {
    const onUpdate = vi.fn();
    const callbacks: Record<string, (payload: unknown) => void> = {};

    // Mock 'on' to capture the callbacks for each table
    mockChannel.on.mockImplementation((_event, config, callback) => {
      callbacks[config.table] = callback;
      return mockChannel;
    });

    setupProjectDashboardRealtime(mockSupabase, {
      projectId: mockProjectId,
      channelPrefix: mockChannelPrefix,
      onUpdate,
    });

    // Simulate an update on the projects table
    callbacks["projects"]?.({ eventType: "UPDATE" });
    expect(onUpdate).toHaveBeenCalledWith({
      table: "projects",
      event: "UPDATE",
    });

    // Simulate an insert on the documents table
    callbacks["documents"]?.({ eventType: "INSERT" });
    expect(onUpdate).toHaveBeenCalledWith({
      table: "documents",
      event: "INSERT",
    });

    // Simulate a null payload (robustness check)
    callbacks["ledger_entries"]?.(null);
    expect(onUpdate).toHaveBeenCalledWith({
      table: "ledger_entries",
      event: "UNKNOWN",
    });
  });

  it("calls subscribe() at the end of the chain", () => {
    setupProjectDashboardRealtime(mockSupabase, {
      projectId: mockProjectId,
      channelPrefix: mockChannelPrefix,
      onUpdate: () => {},
    });

    expect(mockChannel.subscribe).toHaveBeenCalled();
  });
});
