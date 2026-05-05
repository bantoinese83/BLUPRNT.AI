import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/**
 * Public onboarding resume: validates token server-side with service_role RPC.
 * Keeps SECURITY DEFINER RPC callable only from Edge + postgres (not anon PostgREST).
 */

const MAX_TOKEN_LEN = 256;

function corsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get("Origin");
  const raw = Deno.env.get("ALLOWED_ORIGINS");
  const relax = Deno.env.get("CORS_RELAX_LOCAL") === "1";
  const siteBase = Deno.env.get("SITE_URL")?.replace(/\/$/, "") ?? "";

  let allow: string | null = null;
  if (relax && requestOrigin) {
    const local =
      requestOrigin.startsWith("http://localhost:") ||
      requestOrigin.startsWith("http://127.0.0.1:");
    if (local) allow = requestOrigin;
  }
  if (!allow && raw?.trim()) {
    const origins = raw.split(",").map((o) => o.trim()).filter(Boolean);
    if (origins.length && !requestOrigin) allow = origins[0] ?? null;
    else if (requestOrigin && origins.includes(requestOrigin)) {
      allow = requestOrigin;
    }
  }
  if (!allow && !raw?.trim()) {
    if (relax) allow = "*";
    else if (!requestOrigin) allow = siteBase || null;
    else if (siteBase && requestOrigin.replace(/\/$/, "") === siteBase) {
      allow = requestOrigin;
    }
  }

  const base: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-bluprnt-api-version",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
  if (allow) base["Access-Control-Allow-Origin"] = allow;
  return base;
}

function jsonResponse(
  body: unknown,
  status: number,
  req: Request,
  retryAfter?: number,
): Response {
  const headers: Record<string, string> = {
    ...corsHeaders(req),
    "Content-Type": "application/json",
  };
  if (retryAfter != null && status === 429) {
    headers["Retry-After"] = String(retryAfter);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function handleOptions(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const headers = corsHeaders(req);
  const allowed = Boolean(headers["Access-Control-Allow-Origin"]);
  return new Response(null, {
    status: allowed ? 204 : 403,
    headers,
  });
}

const memLimit = new Map<string, { count: number; resetAt: number }>();

function checkSimpleRateLimit(req: Request):
  | { ok: true }
  | { ok: false; retryAfter: number } {
  const windowMs = parseInt(Deno.env.get("RATE_LIMIT_WINDOW_MS") ?? "60000", 10) ||
    60_000;
  const maxReq = parseInt(Deno.env.get("RATE_LIMIT_REQUESTS") ?? "60", 10) || 60;
  const id =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";
  const now = Date.now();
  const e = memLimit.get(id);
  if (!e || now > e.resetAt) {
    memLimit.set(id, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  e.count += 1;
  if (e.count > maxReq) {
    return { ok: false, retryAfter: Math.ceil((e.resetAt - now) / 1000) };
  }
  return { ok: true };
}

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase service configuration");
  return createClient(url, key);
}

Deno.serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const rl = checkSimpleRateLimit(req);
  if (!rl.ok) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      429,
      req,
      rl.retryAfter,
    );
  }

  try {
    const body = (await req.json().catch(() => null)) as { token?: unknown };
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token || token.length > MAX_TOKEN_LEN) {
      return jsonResponse({ error: "Invalid token" }, 400, req);
    }

    const admin = getServiceClient();
    const { data, error } = await admin.rpc("get_onboarding_sync_payload", {
      p_token: token,
    });

    if (error) {
      console.error("[get-onboarding-sync-payload] rpc:", error.message);
      return jsonResponse({ error: "Could not load draft" }, 500, req);
    }

    if (data == null) {
      return jsonResponse({ error: "Link expired or invalid" }, 404, req);
    }

    return jsonResponse(data as Record<string, unknown>, 200, req);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[get-onboarding-sync-payload]", msg);
    return jsonResponse({ error: msg }, 500, req);
  }
});
