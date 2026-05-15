/**
 * In-memory circuit breaker for Gemini HTTP calls (per Edge isolate).
 * Trips after consecutive provider 5xx responses; fast-fails while open.
 */

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_OPEN_MS = 60_000;

type BreakerState = "closed" | "open" | "half_open";

let state: BreakerState = "closed";
let consecutiveFailures = 0;
let openedAt = 0;

function threshold(): number {
  const n = parseInt(
    Deno.env.get("GEMINI_CIRCUIT_FAILURE_THRESHOLD") ?? "",
    10,
  );
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_FAILURE_THRESHOLD;
}

function openMs(): number {
  const n = parseInt(Deno.env.get("GEMINI_CIRCUIT_OPEN_MS") ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_OPEN_MS;
}

export class GeminiCircuitOpenError extends Error {
  readonly retryAfterSec: number;

  constructor(retryAfterSec: number) {
    super("AI provider is temporarily unavailable. Please try again shortly.");
    this.name = "GeminiCircuitOpenError";
    this.retryAfterSec = retryAfterSec;
  }
}

export function isGeminiServerError(status: number): boolean {
  return status >= 500 && status <= 599;
}

/** Call before each Gemini request. Throws GeminiCircuitOpenError when tripped. */
export function assertGeminiCircuitClosed(): void {
  if (state === "closed") return;

  const elapsed = Date.now() - openedAt;
  if (state === "open" && elapsed >= openMs()) {
    state = "half_open";
    return;
  }

  const remainingMs = state === "open"
    ? Math.max(0, openMs() - elapsed)
    : openMs();
  throw new GeminiCircuitOpenError(Math.ceil(remainingMs / 1000));
}

export function recordGeminiSuccess(): void {
  consecutiveFailures = 0;
  state = "closed";
}

export function recordGeminiFailure(httpStatus?: number): void {
  if (httpStatus != null && !isGeminiServerError(httpStatus)) {
    return;
  }
  consecutiveFailures += 1;
  if (consecutiveFailures >= threshold()) {
    state = "open";
    openedAt = Date.now();
  }
}

/** Test-only reset */
export function resetGeminiCircuitForTests(): void {
  state = "closed";
  consecutiveFailures = 0;
  openedAt = 0;
}
