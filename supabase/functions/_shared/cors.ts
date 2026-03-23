/**
 * CORS headers – restricts to allowed origins for security.
 * Set ALLOWED_ORIGINS env (comma-separated) or falls back to * for dev.
 */
function getAllowedOrigin(requestOrigin: string | null): string {
  const allowed = Deno.env.get("ALLOWED_ORIGINS");
  if (!allowed?.trim()) {
    return "*";
  }
  const origins = allowed.split(",").map((o) => o.trim()).filter(Boolean);
  if (origins.length === 0) return "*";
  if (requestOrigin && origins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return origins[0];
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(origin),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
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
