import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { getServiceClient } from "../_shared/auth.ts";

/**
 * Public endpoint: fetch project summary + scope by share token.
 * No auth required. Rate limited.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405, req);
  }

  const { ok, retryAfter } = checkRateLimit(req);
  if (!ok) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      429,
      req,
      retryAfter ?? 60,
    );
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();
    if (!token) {
      return jsonResponse({ error: "Token required" }, 400, req);
    }

    const admin = getServiceClient();
    const { data: row, error: tokenErr } = await admin
      .from("project_view_tokens")
      .select("project_id, expires_at")
      .eq("token", token)
      .single();

    if (tokenErr || !row) {
      return jsonResponse({ error: "Link not found or expired" }, 404, req);
    }

    const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
    if (expiresAt && expiresAt < new Date()) {
      return jsonResponse({ error: "Link has expired" }, 410, req);
    }

    const { data: project, error: projErr } = await admin
      .from("projects")
      .select("id, name, estimated_min_total, estimated_max_total, confidence_score")
      .eq("id", row.project_id)
      .single();

    if (projErr || !project) {
      return jsonResponse({ error: "Project not found" }, 404, req);
    }

    const { data: scopeItems } = await admin
      .from("scope_items")
      .select("id, category, description, finish_tier, quantity, unit, total_cost_min, total_cost_max")
      .eq("project_id", row.project_id)
      .order("created_at", { ascending: true });

    return jsonResponse(
      {
        project: {
          id: project.id,
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
          confidence_score: project.confidence_score,
        },
        scope_items: scopeItems ?? [],
      },
      200,
      req,
    );
  } catch (e) {
    console.error(e);
    return jsonResponse(
      { error: "Something went wrong. Try again later." },
      500,
      req,
    );
  }
});
