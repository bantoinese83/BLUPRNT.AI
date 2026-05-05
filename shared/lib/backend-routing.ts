/**
 * Centralized registry of Supabase Edge Functions.
 * Ensures consistent naming and URL construction across Web, Mobile, and SQL.
 */

export const EDGE_FUNCTIONS = {
  UPLOAD_DOCUMENT: "upload-document",
  GET_LEDGER_ENTRY: "get-ledger-entry",
  PROCESS_QUEUE: "process-document-queue",
  CLEANUP_STORAGE: "cleanup-storage",
  CHECK_SUBSCRIPTIONS: "check-subscription-status",
  CHAT_WITH_PROJECT: "chat-with-project",
  DELETE_ACCOUNT: "delete-account",
  GET_ONBOARDING_CONTEXT: "get-onboarding-context",
  GET_ONBOARDING_SYNC_PAYLOAD: "get-onboarding-sync-payload",
  SUBMIT_LEAD: "submit-marketing-lead",
} as const;

export const API_VERSIONS = {
  V1: "2026-04-20",
  V2: "2026-04-26",
} as const;

export type EdgeFunctionName =
  (typeof EDGE_FUNCTIONS)[keyof typeof EDGE_FUNCTIONS];

/**
 * Construct the full URL for an Edge Function.
 * Logic differs between Local Dev (Docker) and Production.
 */
export function getEdgeFunctionUrl(
  name: EdgeFunctionName,
  supabaseUrl: string,
): string {
  // If supabaseUrl is a local Docker URL or localhost, the format is slightly different
  // in some network configurations, but typically follows the standard /functions/v1/ path.
  const base = supabaseUrl.endsWith("/")
    ? supabaseUrl.slice(0, -1)
    : supabaseUrl;
  return `${base}/functions/v1/${name}`;
}
