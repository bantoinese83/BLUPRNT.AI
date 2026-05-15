/**
 * Rate limiting for Edge Functions (Upstash Redis when configured, else in-memory per isolate).
 *
 * Kinds:
 * - `default` — RATE_LIMIT_REQUESTS / RATE_LIMIT_WINDOW_MS (default 60/min)
 * - `marketing` — stricter for public lead capture (default 10/hour)
 * - `public_share` — unauthenticated project view by token (default 30/min)
 * - `ai` — chat / LLM endpoints (default 20/min)
 */
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export type RateLimitKind = "default" | "marketing" | "public_share" | "ai";

function specFor(kind: RateLimitKind): {
  requests: number;
  windowMs: number;
  prefix: string;
} {
  switch (kind) {
    case "marketing":
      return {
        requests:
          parseInt(Deno.env.get("RATE_LIMIT_MARKETING_REQUESTS") ?? "10", 10) ||
          10,
        windowMs: parseInt(
          Deno.env.get("RATE_LIMIT_MARKETING_WINDOW_MS") ?? "3600000",
          10,
        ) || 3_600_000,
        prefix: "blueprint-edge-marketing",
      };
    case "ai":
      return {
        requests:
          parseInt(Deno.env.get("RATE_LIMIT_AI_REQUESTS") ?? "20", 10) || 20,
        windowMs:
          parseInt(Deno.env.get("RATE_LIMIT_AI_WINDOW_MS") ?? "60000", 10) ||
          60_000,
        prefix: "blueprint-edge-ai",
      };
    case "public_share":
      return {
        requests:
          parseInt(
            Deno.env.get("RATE_LIMIT_PUBLIC_SHARE_REQUESTS") ?? "30",
            10,
          ) || 30,
        windowMs:
          parseInt(
            Deno.env.get("RATE_LIMIT_PUBLIC_SHARE_WINDOW_MS") ?? "60000",
            10,
          ) || 60_000,
        prefix: "blueprint-edge-public-share",
      };
    default:
      return {
        requests: parseInt(Deno.env.get("RATE_LIMIT_REQUESTS") ?? "60", 10) ||
          60,
        windowMs:
          parseInt(Deno.env.get("RATE_LIMIT_WINDOW_MS") ?? "60000", 10) ||
          60_000,
        prefix: "blueprint-edge",
      };
  }
}

const memoryStores = new Map<
  RateLimitKind,
  Map<string, { count: number; resetAt: number }>
>();

const redisLimits = new Map<RateLimitKind, Ratelimit | null | undefined>();

function getMemoryStore(kind: RateLimitKind) {
  if (!memoryStores.has(kind)) {
    memoryStores.set(kind, new Map());
  }
  return memoryStores.get(kind)!;
}

function getRedisLimit(kind: RateLimitKind): Ratelimit | null {
  if (redisLimits.has(kind)) {
    return redisLimits.get(kind)!;
  }
  try {
    const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
    const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
    const spec = specFor(kind);
    if (!url || !token) {
      console.warn(
        `[rate-limit] Upstash secrets missing for ${kind}. Falling back to in-memory.`,
      );
      redisLimits.set(kind, null);
      return null;
    }

    console.log(
      `[rate-limit] Initializing Upstash Redis for ${kind} (URL: ${
        url.substring(0, 15)
      }...)`,
    );

    const redis = new Redis({ url, token });
    const windowSeconds = Math.max(1, Math.ceil(spec.windowMs / 1000));
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(spec.requests, `${windowSeconds} s`),
      prefix: spec.prefix,
      analytics: Deno.env.get("ENABLE_RATE_LIMIT_ANALYTICS") === "true",
    });
    redisLimits.set(kind, rl);
    return rl;
  } catch (e) {
    console.error(`[rate-limit] Redis client init failed for ${kind}:`, e);
    redisLimits.set(kind, null);
    return null;
  }
}

export function getClientId(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      "unknown"
  );
}

function checkRateLimitInMemory(
  req: Request,
  kind: RateLimitKind,
): { ok: boolean; retryAfter?: number } {
  const spec = specFor(kind);
  const store = getMemoryStore(kind);
  const id = getClientId(req);
  const now = Date.now();
  const entry = store.get(id);

  if (!entry) {
    store.set(id, { count: 1, resetAt: now + spec.windowMs });
    return { ok: true };
  }

  if (now > entry.resetAt) {
    store.set(id, { count: 1, resetAt: now + spec.windowMs });
    return { ok: true };
  }

  entry.count++;
  if (entry.count > spec.requests) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true };
}

export async function checkRateLimit(
  req: Request,
  kind: RateLimitKind = "default",
): Promise<{ ok: boolean; retryAfter?: number }> {
  try {
    const rl = getRedisLimit(kind);
    if (rl) {
      const id = getClientId(req);
      const { success, reset, limit, remaining: _remaining } = await rl.limit(id);

      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        console.warn(
          `[rate-limit] ${kind} EXCEEDED for ${id}. Limit: ${limit}. Retry after: ${retryAfter}s`,
        );
        return { ok: false, retryAfter };
      }
      return { ok: true };
    }
  } catch (e) {
    console.error(
      `[rate-limit] Redis call failed for ${kind}; falling back to memory:`,
      e,
    );
  }
  return checkRateLimitInMemory(req, kind);
}
