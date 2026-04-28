import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase.gen.ts";

/**
 * Common subscription setup for project-related changes (dashboard data).
 * Subscribes to:
 * - projects (metadata)
 * - ledger_entries (financials)
 * - scope_items (budget/tasks)
 * - documents (processing status)
 */
export function setupProjectDashboardRealtime(
  supabase: SupabaseClient<Database>,
  options: {
    projectId: string;
    channelPrefix: string;
    onUpdate: (payload: { table: string; event: string }) => void;
  },
) {
  const { projectId, channelPrefix, onUpdate } = options;

  // Use a unique suffix to prevent "cannot add callbacks after subscribe" errors
  // which happen if we reuse a channel name that hasn't finished cleanup.
  const uniqueId = Math.random().toString(36).slice(2, 9);
  const channelName = `${channelPrefix}:${projectId}:${uniqueId}`;

  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "projects",
        filter: `id=eq.${projectId}`,
      },
      (payload) =>
        onUpdate({ table: "projects", event: payload?.eventType ?? "UNKNOWN" }),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ledger_entries",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) =>
        onUpdate({
          table: "ledger_entries",
          event: payload?.eventType ?? "UNKNOWN",
        }),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "scope_items",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) =>
        onUpdate({
          table: "scope_items",
          event: payload?.eventType ?? "UNKNOWN",
        }),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "documents",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) =>
        onUpdate({
          table: "documents",
          event: payload?.eventType ?? "UNKNOWN",
        }),
    )
    .subscribe();
}
