/**
 * Lightweight Sentry reporting for Supabase Edge Functions (fetch envelope API).
 * Set SENTRY_DSN in function secrets (same project as web/mobile is fine).
 */

type ParsedDsn = {
  publicKey: string;
  host: string;
  projectId: string;
};

let parsedDsn: ParsedDsn | null | undefined;

function parseSentryDsn(dsn: string): ParsedDsn | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "").split("/")[0];
    const publicKey = u.username;
    if (!publicKey || !projectId || !u.host) return null;
    return { publicKey, host: u.host, projectId };
  } catch {
    return null;
  }
}

function getDsn(): ParsedDsn | null {
  if (parsedDsn !== undefined) return parsedDsn;
  const raw = Deno.env.get("SENTRY_DSN")?.trim();
  if (!raw) {
    parsedDsn = null;
    return null;
  }
  parsedDsn = parseSentryDsn(raw);
  return parsedDsn;
}

function randomEventId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function toException(err: unknown): { type: string; value: string } {
  if (err instanceof Error) {
    return { type: err.name || "Error", value: err.message || String(err) };
  }
  return { type: "Error", value: String(err) };
}

/**
 * Fire-and-forget exception capture. Never throws; safe inside catch blocks.
 */
export function captureEdgeException(
  err: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    fingerprint?: string[];
  },
): void {
  const dsn = getDsn();
  if (!dsn) return;

  const event = {
    event_id: randomEventId(),
    timestamp: new Date().toISOString(),
    platform: "javascript",
    level: "error",
    environment: Deno.env.get("SENTRY_ENVIRONMENT") ??
      Deno.env.get("ENVIRONMENT") ??
      "production",
    server_name: "supabase-edge",
    exception: { values: [toException(err)] },
    tags: {
      runtime: "deno-edge",
      ...context?.tags,
    },
    extra: context?.extra,
    fingerprint: context?.fingerprint,
  };

  const storeUrl =
    `https://${dsn.host}/api/${dsn.projectId}/store/?sentry_version=7&sentry_key=${dsn.publicKey}`;

  const auth =
    `Sentry sentry_version=7, sentry_client=bluprnt-edge/1.0, sentry_key=${dsn.publicKey}`;

  void fetch(storeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sentry-Auth": auth,
    },
    body: JSON.stringify(event),
  }).catch(() => {
    /* avoid recursive logging */
  });
}

export function isEdgeSentryConfigured(): boolean {
  return getDsn() !== null;
}
