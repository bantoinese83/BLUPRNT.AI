/**
 * CORS — set ALLOWED_ORIGINS (comma-separated) in production.
 * When unset, allows `*` (local / backwards compatibility).
 * When set, only listed origins get Access-Control-Allow-Origin (no implicit domain bypass).
 * Non-browser clients often omit Origin; we then echo the first allowlisted host.
 */
function resolveAccessControlAllowOrigin(req: Request): string | null {
  const requestOrigin = req.headers.get("Origin");
  const raw = Deno.env.get("ALLOWED_ORIGINS");

  if (!raw?.trim()) {
    return "*";
  }

  const origins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    return "*";
  }
  if (origins.includes("*")) {
    return "*";
  }

  if (!requestOrigin) {
    return origins[0] ?? null;
  }

  if (origins.includes(requestOrigin)) {
    return requestOrigin;
  }

  console.warn("[cors] Blocked Origin:", requestOrigin);
  return null;
}

const BASE_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function getCorsHeaders(req: Request): Record<string, string> {
  const acao = resolveAccessControlAllowOrigin(req);
  if (!acao) {
    return { ...BASE_HEADERS };
  }
  return {
    ...BASE_HEADERS,
    "Access-Control-Allow-Origin": acao,
  };
}

/** Returns a Response for OPTIONS, or null if not an OPTIONS request. */
export function handleOptions(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const headers = getCorsHeaders(req);
  const allowed = Boolean(headers["Access-Control-Allow-Origin"]);
  return new Response(null, {
    status: allowed ? 204 : 403,
    headers,
  });
}

export function jsonResponse(
  body: unknown,
  status: number,
  req: Request,
  retryAfter?: number,
): Response {
  const headers: Record<string, string> = {
    ...getCorsHeaders(req),
    "Content-Type": "application/json",
  };
  if (retryAfter != null && status === 429) {
    headers["Retry-After"] = String(retryAfter);
  }
  return new Response(JSON.stringify(body), { status, headers });
}
