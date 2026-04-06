/**
 * Rate limiting for Edge Functions.
 *
 * When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set (e.g. Vercel /
 * Supabase secrets), limits are enforced in a shared Redis store (Upstash) so abuse
 * cannot fan out across isolates or regions.
 *
 * Otherwise falls back to an in-memory map (per-isolate, resets when isolates recycle).
 *
 * Set `RATE_LIMIT_REQUESTS` (default 60) and `RATE_LIMIT_WINDOW_MS` (default 60000).
 */
import { Redis } from "npm:@upstash/redis@1.34.3";
import { Ratelimit } from "npm:@upstash/ratelimit@2.0.5";

const store = new Map<string, { count: number; resetAt: number }>();

const REQUESTS =
  parseInt(Deno.env.get("RATE_LIMIT_REQUESTS") ?? "60", 10) || 60;
const WINDOW_MS =
  parseInt(Deno.env.get("RATE_LIMIT_WINDOW_MS") ?? "60000", 10) || 60000;

let sharedLimit: Ratelimit | null | undefined;

function getSharedLimit(): Ratelimit | null {
  if (sharedLimit !== undefined) {
    return sharedLimit;
  }
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    sharedLimit = null;
    return sharedLimit;
  }
  const redis = new Redis({ url, token });
  const windowSeconds = Math.max(1, Math.ceil(WINDOW_MS / 1000));
  sharedLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(REQUESTS, `${windowSeconds} s`),
    prefix: "blueprint-edge",
  });
  return sharedLimit;
}

function getClientId(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimitInMemory(req: Request): {
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

export async function checkRateLimit(req: Request): Promise<{
  ok: boolean;
  retryAfter?: number;
}> {
  const rl = getSharedLimit();
  if (rl) {
    const id = getClientId(req);
    const { success, reset } = await rl.limit(id);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return { ok: false, retryAfter };
    }
    return { ok: true };
  }
  return checkRateLimitInMemory(req);
}
