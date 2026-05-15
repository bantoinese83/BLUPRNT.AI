import { jsonResponse } from "./cors.ts";
import { AiDailyQuotaExceededError } from "./ai-usage-quota.ts";
import { GeminiCircuitOpenError } from "./gemini-circuit-breaker.ts";
import { logEdge } from "./log.ts";

/**
 * Maps AI guardrail errors to HTTP responses. Returns null if not handled.
 */
export function aiGuardrailResponse(
  e: unknown,
  req: Request,
  functionName: string,
): Response | null {
  if (e instanceof GeminiCircuitOpenError) {
    return jsonResponse(
      { error: e.message, code: "ai_provider_busy" },
      503,
      req,
      e.retryAfterSec,
    );
  }
  if (e instanceof AiDailyQuotaExceededError) {
    return jsonResponse(
      { error: e.message, code: "ai_daily_quota_exceeded", limit: e.limit },
      429,
      req,
    );
  }
  return null;
}

export function logEdgeFatal(functionName: string, e: unknown): void {
  logEdge("error", `${functionName} handler failed`, {
    function: functionName,
    error: e,
    detail: e instanceof Error ? e.message : String(e),
  });
}
