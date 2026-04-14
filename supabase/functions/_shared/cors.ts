/**
 * CORS — set ALLOWED_ORIGINS (comma-separated) in production.
 * When unset: fail closed unless CORS_RELAX_LOCAL=1 (then `*`).
 * Wildcard in ALLOWED_ORIGINS requires CORS_RELAX_LOCAL=1.
 * Non-browser clients often omit Origin; we then echo SITE_URL or the first allowlisted host.
 */
function resolveAccessControlAllowOrigin(req: Request): string | null {
  const requestOrigin = req.headers.get("Origin");
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  const relax = Deno.env.get("CORS_RELAX_LOCAL") === "1";
  const siteBase = Deno.env.get("SITE_URL")?.replace(/\/$/, "") ?? "";

  if (!raw?.trim()) {
    if (relax) {
      return "*";
    }
    if (!requestOrigin) {
      return siteBase || null;
    }
    if (
      siteBase &&
      requestOrigin.replace(/\/$/, "") === siteBase
    ) {
      return requestOrigin;
    }
    console.warn(
      "[cors] ALLOWED_ORIGINS unset — set it or CORS_RELAX_LOCAL=1 for local dev",
    );
    return null;
  }

  const origins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    if (relax) {
      return "*";
    }
    return null;
  }
  if (origins.includes("*")) {
    if (relax) {
      return "*";
    }
    console.warn(
      "[cors] Wildcard ALLOWED_ORIGINS requires CORS_RELAX_LOCAL=1",
    );
    return null;
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
