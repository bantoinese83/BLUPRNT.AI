/**
 * Per-user daily AI request budget (Upstash when configured, else in-memory per isolate).
 */

import { Redis } from "@upstash/redis";

const DEFAULT_DAILY_LIMIT = 200;

type MemoryEntry = { count: number; dayKey: string };

const memory = new Map<string, MemoryEntry>();

let redis: Redis | null | undefined;

function dailyLimit(): number {
  const n = parseInt(Deno.env.get("AI_DAILY_REQUESTS_PER_USER") ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
}

function utcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    redis = null;
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

export class AiDailyQuotaExceededError extends Error {
  readonly limit: number;
  readonly resetDay: string;

  constructor(limit: number, resetDay: string) {
    super(
      "Daily AI assistant limit reached. Try again tomorrow or contact support.",
    );
    this.name = "AiDailyQuotaExceededError";
    this.limit = limit;
    this.resetDay = resetDay;
  }
}

/**
 * Increments usage and throws if the user exceeded their daily budget.
 * Call once per AI edge invocation after auth resolves userId.
 */
export async function assertAiDailyQuota(userId: string): Promise<void> {
  const limit = dailyLimit();
  const day = utcDayKey();
  const key = `ai-daily:${userId}:${day}`;

  const client = getRedis();
  if (client) {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, 86_400);
    }
    if (count > limit) {
      throw new AiDailyQuotaExceededError(limit, day);
    }
    return;
  }

  const entry = memory.get(userId);
  if (!entry || entry.dayKey !== day) {
    memory.set(userId, { count: 1, dayKey: day });
    return;
  }
  entry.count += 1;
  if (entry.count > limit) {
    throw new AiDailyQuotaExceededError(limit, day);
  }
}

/** Test-only */
export function resetAiQuotaMemoryForTests(): void {
  memory.clear();
}
