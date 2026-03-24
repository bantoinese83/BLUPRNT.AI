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
  cityFromZip,
  extractScopeWithGemini,
  type RoomType,
} from "./_shared/estimate.ts";
import { type GeminiPart } from "../_shared/gemini.ts";

// @ts-ignore
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
    console.log(`[photo-to-scope] Received ${photoCount} photos, zip: ${formData.get("zip_code")}, room: ${formData.get("room_type")}`);

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

    let payload = null;

    // 1. Try Gemini if photos or description provided
    const photoParts: GeminiPart[] = [];
    for (const p of photos) {
      if (p instanceof File && p.size > 0) {
        const buf = await p.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
        photoParts.push({
          inline_data: {
            mime_type: p.type || "image/jpeg",
            data: base64,
          },
        });
      }
    }

    // 1. Call Gemini for estimation (Mocks removed per user request)
    payload = await extractScopeWithGemini({
      room_type: room_type as RoomType,
      zip_code,
      finish_preference,
      scopeDescription: scope_description,
      photoParts,
    });
    
    if (!payload) {
      return jsonResponse({ 
        error: "AI estimation failed. Please try adding a description or better photos." 
      }, 500, req);
    }

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
        metadata: {
          justification: s.justification,
          priority: s.priority,
          phase: s.phase,
          maintenance_tips: s.maintenance_tips,
        },
      }));

      const { data: inserted, error: insErr } = await admin
        .from("scope_items")
        .insert(rows)
        .select("id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score, source, metadata");

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
          metadata: {
            value_engineering_tips: payload.summary.value_engineering_tips,
            regional_context: payload.summary.regional_context,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      const scope_items = (inserted ?? []).map((r: any) => ({
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
        justification: r.metadata?.justification,
        priority: r.metadata?.priority,
        phase: r.metadata?.phase,
        maintenance_tips: r.metadata?.maintenance_tips,
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
