import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getCorsHeaders, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { photoToScopeSchema } from "../_shared/validation.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";
import {
  buildScopePayload,
  cityFromZip,
  type RoomType,
} from "./_shared/estimate.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  if (req.method !== "POST") {
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
    const formData = await req.formData();
    const photos = formData.getAll("photos[]").length
      ? formData.getAll("photos[]")
      : formData.getAll("photos");
    const photoCount = Array.from(photos).filter(
      (p) => p instanceof File && p.size > 0,
    ).length;

    const parsed = photoToScopeSchema.safeParse({
      zip_code: String(formData.get("zip_code") ?? "").trim() || "00000",
      room_type: String(formData.get("room_type") ?? "other"),
      finish_preference: String(formData.get("finish_preference") ?? "mid"),
      project_id: (formData.get("project_id") as string | null)?.trim() || null,
      location_unset: String(formData.get("location_unset") ?? ""),
      scope_description: (formData.get("scope_description") as string | null)?.trim() || null,
    });

    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid request";
      return jsonResponse({ error: msg }, 400, req);
    }

    const { zip_code, room_type, finish_preference, project_id, location_unset, scope_description } = parsed.data;
    const projectId = project_id ?? null;

    const payload = buildScopePayload({
      room_type: room_type as RoomType,
      zip_code,
      finish_preference,
      photoCount,
      locationUnset: location_unset,
      scopeDescription: scope_description,
    });

    if (projectId) {
      const userId = await getUserIdFromRequest(req);
      if (!userId) {
        return jsonResponse({ error: "Sign in to save this to a project." }, 401, req);
      }
      const admin = getServiceClient();
      try {
        await assertProjectOwner(admin, projectId, userId);
      } catch (e) {
        const m = e instanceof Error ? e.message : "";
        if (m === "not_found") return jsonResponse({ error: "Project not found" }, 404, req);
        return jsonResponse({ error: "Access denied" }, 403, req);
      }

      await admin.from("scope_items").delete().eq("project_id", projectId);

      const rows = payload.scope_items.map((s) => ({
        project_id: projectId,
        category: s.category,
        description: s.description,
        finish_tier: s.finish_tier,
        quantity: s.quantity,
        unit: s.unit,
        unit_cost_min: s.unit_cost_min,
        unit_cost_max: s.unit_cost_max,
        total_cost_min: s.total_cost_min,
        total_cost_max: s.total_cost_max,
        confidence_score: s.confidence_score,
        source: s.source,
      }));

      const { data: inserted, error: insErr } = await admin
        .from("scope_items")
        .insert(rows)
        .select("id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score, source");

      if (insErr) {
        console.error(insErr);
        return jsonResponse({ error: "Could not save scope" }, 500, req);
      }

      await admin
        .from("projects")
        .update({
          estimated_min_total: payload.summary.estimated_min_total,
          estimated_max_total: payload.summary.estimated_max_total,
          confidence_score: payload.summary.confidence_score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      const scope_items = (inserted ?? []).map((r) => ({
        id: r.id,
        category: r.category,
        description: r.description,
        finish_tier: r.finish_tier,
        quantity: r.quantity,
        unit: r.unit,
        unit_cost_min: r.unit_cost_min,
        unit_cost_max: r.unit_cost_max,
        total_cost_min: r.total_cost_min,
        total_cost_max: r.total_cost_max,
        confidence_score: r.confidence_score,
        source: r.source,
      }));

      return jsonResponse(
        {
          project_id: projectId,
          summary: payload.summary,
          scope_items,
          explanations: payload.explanations,
        },
        200,
        req,
      );
    }

    const scope_items = payload.scope_items.map((s, i) => ({
      id: `scope_${i + 1}`,
      ...s,
    }));

    return jsonResponse(
      {
        project_id: null,
        summary: payload.summary,
        scope_items,
        explanations: payload.explanations,
        area_label: cityFromZip(zip_code),
      },
      200,
      req,
    );
  } catch (e) {
    console.error(e);
    return jsonResponse(
      { error: "Something went wrong. Try again in a moment." },
      500,
      req,
    );
  }
});
