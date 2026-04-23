import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { photoToScopeSchema } from "../_shared/validation.ts";
import {
  assertProjectOwner,
  getServiceClient,
  getUserIdFromRequest,
} from "../_shared/auth.ts";
import {
  cityFromZip,
  cityFromZipUniversal,
  extractScopeWithGemini,
  getFallbackEstimate,
  normalizeScopeSourceForDb,
  type RoomType,
} from "./_shared/estimate.ts";
import { type GeminiPart } from "../_shared/gemini.ts";

/** Keeps vision requests under Edge wall-clock limits (150s free / busy Gemini). */
const MAX_VISION_PHOTOS = 4;

/** Multipart-safe base64 (avoids huge `reduce` strings and `apply` stack limits). */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(binary);
}

Deno.serve(async (req: Request) => {
  try {
    const opt = handleOptions(req);
    if (opt) return opt;
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, req);
    }

    const { ok, retryAfter } = await checkRateLimit(req);
    if (!ok) {
      return jsonResponse(
        { error: "Too many requests. Please try again later." },
        429,
        req,
        retryAfter ?? 60,
      );
    }

    const formData = await req.formData();
    const photos = formData.getAll("photos[]").length
      ? formData.getAll("photos[]")
      : formData.getAll("photos");
    const photoFiles = Array.from(photos).filter(
      (p): p is File => p instanceof File && p.size > 0,
    );
    const photoCount = photoFiles.length;

    // is_initial_analysis=1 means: safe to wipe existing scope (first-time).
    // Any subsequent re-analysis must use upsert to preserve user edits.
    const isInitialAnalysis =
      String(formData.get("is_initial_analysis") ?? "1") === "1";

    // Validate ZIP code
    let zipCodeInput = String(formData.get("zip_code") ?? "").trim();
    if (zipCodeInput && !/^\d{5}$/.test(zipCodeInput)) {
      zipCodeInput = "00000";
    }

    const parsed = photoToScopeSchema.safeParse({
      zip_code: zipCodeInput || "00000",
      room_type: String(formData.get("room_type") ?? "other"),
      finish_preference: String(formData.get("finish_preference") ?? "mid"),
      project_id: (formData.get("project_id") as string | null)?.trim() || null,
      location_unset: String(formData.get("location_unset") ?? ""),
      scope_description:
        (formData.get("scope_description") as string | null)?.trim() || null,
    });

    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Invalid request";
      return jsonResponse({ error: msg }, 400, req);
    }

    const {
      zip_code,
      room_type,
      finish_preference,
      project_id,
      scope_description,
    } = parsed.data;

    if (photoCount === 0 && !scope_description) {
      return jsonResponse(
        { error: "Provide at least one photo or a description." },
        400,
        req,
      );
    }

    const userId = await getUserIdFromRequest(req);
    const admin = getServiceClient();

    if (project_id && userId) {
      try {
        await assertProjectOwner(admin, project_id, userId);
      } catch (e) {
        const m = e instanceof Error ? e.message : "";
        if (m === "not_found")
          return jsonResponse({ error: "Project not found" }, 404, req);
        return jsonResponse({ error: "Access denied" }, 403, req);
      }
    }

    const photoParts: GeminiPart[] = [];
    for (const p of photoFiles.slice(0, MAX_VISION_PHOTOS)) {
      const buf = await p.arrayBuffer();
      photoParts.push({
        inline_data: {
          mime_type: p.type || "image/jpeg",
          data: uint8ArrayToBase64(new Uint8Array(buf)),
        },
      });
    }

    let payload = await extractScopeWithGemini({
      room_type: room_type as RoomType,
      zip_code,
      finish_preference,
      scopeDescription: scope_description,
      photoParts,
    });

    let usedFallback = false;
    if (!payload) {
      usedFallback = true;
      payload = getFallbackEstimate(room_type as RoomType, zip_code);
    }

    const safeMapItems = (items: any[]) =>
      items.map((r: any, i: number) => {
        const metadata = r.metadata || {};
        const isFromDB = !!r.id && String(r.id).includes("-");
        const materials = Array.isArray(metadata.materials)
          ? metadata.materials
          : Array.isArray(r.materials)
            ? r.materials
            : [];

        return {
          id: isFromDB ? r.id : `scope_${i + 1}`,
          category: r.category || "General",
          description: r.description || "",
          finish_tier: r.finish_tier || "mid",
          quantity: Number(r.quantity || 0),
          unit: r.unit || "unit",
          unit_cost_min: Number(r.unit_cost_min || 0),
          unit_cost_max: Number(r.unit_cost_max || 0),
          total_cost_min: Number(r.total_cost_min || 0),
          total_cost_max: Number(r.total_cost_max || 0),
          confidence_score: Number(r.confidence_score || 3),
          source: r.source || "text",
          verification_required: !!r.verification_required,
          metadata: {
            justification: metadata.justification || "",
            priority: metadata.priority || "medium",
            phase: metadata.phase || "standard",
            maintenance_tips: metadata.maintenance_tips || "",
            materials,
          },
        };
      });

    if (project_id && userId) {
      if (isInitialAnalysis) {
        await admin.from("scope_items").delete().eq("project_id", project_id);
      }

      const rows = payload.scope_items.map((s) => ({
        project_id,
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
        source: normalizeScopeSourceForDb(s.source),
        metadata: {
          justification: s.justification || "",
          priority: s.priority || "medium",
          phase: s.phase || "standard",
          maintenance_tips: s.maintenance_tips || "",
          materials: Array.isArray(s.materials) ? s.materials : [],
        },
      }));

      const { data: inserted, error: insErr } = await admin
        .from("scope_items")
        .insert(rows)
        .select();

      if (insErr) return jsonResponse({ error: "Could not save scope" }, 500, req);

      // Handle onboarding photo storage for the Transformation Slider
      let firstPhotoPath: string | null = null;
      if (photoFiles.length > 0) {
        // Upload the first photo to projects bucket as the initial "Before" state
        const first = photoFiles[0];
        const ext = first.name.includes(".") ? first.name.slice(first.name.lastIndexOf(".")) : ".jpg";
        const path = `${project_id}/${userId}/before_photo${ext}`;
        const { error: uploadErr } = await admin.storage
          .from("project-documents")
          .upload(path, await first.arrayBuffer(), {
            contentType: first.type || "image/jpeg",
            upsert: true,
          });
        
        if (!uploadErr) {
          firstPhotoPath = path;
          // Create a record in documents table too
          await admin.from("documents").insert({
            project_id,
            type: "photo",
            storage_path: path,
            original_filename: first.name,
            uploaded_by_user_id: userId,
            ocr_status: "success"
          });
        }
      }

      await admin
        .from("projects")
        .update({
          estimated_min_total: payload.summary.estimated_min_total,
          estimated_max_total: payload.summary.estimated_max_total,
          confidence_score: payload.summary.confidence_score,
          grounding_sources: payload.summary.grounding_sources || [],
          before_photo_storage_path: firstPhotoPath,
          after_photo_storage_path: firstPhotoPath,
          metadata: {
            value_engineering_tips: payload.summary.value_engineering_tips,
            regional_context: payload.summary.regional_context,
            regional_signal: payload.summary.regional_signal,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", project_id);

      return jsonResponse(
        {
          project_id,
          summary: payload.summary,
          scope_items: safeMapItems(inserted ?? []),
          explanations: payload.explanations,
          used_fallback: usedFallback,
        },
        200,
        req,
      );
    }

    const areaLabel = await cityFromZipUniversal(zip_code);
    return jsonResponse(
      {
        project_id: null,
        summary: payload.summary,
        scope_items: safeMapItems(payload.scope_items ?? []),
        explanations: payload.explanations,
        area_label: areaLabel || cityFromZip(zip_code),
        used_fallback: usedFallback,
      },
      200,
      req,
    );
  } catch (e: unknown) {
    const error = e as Error;
    console.error("[photo-to-scope] top-level:", error.stack || error);
    return jsonResponse({ error: "Something went wrong." }, 500, req);
  }
});
