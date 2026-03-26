/**
 * In-memory rate limiter per Edge Function instance (resets when isolates recycle).
 *
 * At higher traffic, use a shared store so limits apply across instances, e.g.:
 * - Upstash Redis + sliding window, or
 * - Supabase table/Vault-backed counter with advisory locks, or
 * - API gateway rate limits (Cloudflare, Kong) in front of functions.
 *
 * Set RATE_LIMIT_REQUESTS (default 60) and RATE_LIMIT_WINDOW_MS (default 60000).
 */
const store = new Map<string, { count: number; resetAt: number }>();

const REQUESTS =
  parseInt(Deno.env.get("RATE_LIMIT_REQUESTS") ?? "60", 10) || 60;
const WINDOW_MS =
  parseInt(Deno.env.get("RATE_LIMIT_WINDOW_MS") ?? "60000", 10) || 60000;

function getClientId(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function checkRateLimit(req: Request): {
  ok: boolean;
  retryAfter?: number;
} {
  const id = getClientId(req);
  const now = Date.now();
  const entry = store.get(id);

  if (!entry) {
    store.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  if (now > entry.resetAt) {
    store.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }

  entry.count++;
  if (entry.count > REQUESTS) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}
