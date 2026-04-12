import { SupabaseClient } from "@supabase/supabase-js";
import { invokeFunction } from "./supabase";
import { reportClientError } from "@/lib/sentry";
import type { PhotoToScopeResult } from "@/types/estimate";
import {
  DEFAULT_ESTIMATE_MIN,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_CONFIDENCE,
  projectTypeToRoomType,
  projectTypeToDb,
  stageToDb,
  projectDisplayName,
  type ProjectTypeOption,
  type StageOption,
} from "@shared/lib/onboarding-helpers";

export {
  DEFAULT_ESTIMATE_MIN,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_CONFIDENCE,
  projectTypeToRoomType,
  projectTypeToDb,
  stageToDb,
  projectDisplayName,
};

export async function saveOnboardingProject(params: {
  supabase: SupabaseClient;
  userId: string;
  projectType: ProjectTypeOption | null;
  stage: StageOption | null;
  locationInput: string;
  zipCode: string;
  estimate: PhotoToScopeResult | null;
  photos: File[];
}) {
  const {
    supabase,
    userId,
    projectType,
    stage,
    locationInput,
    zipCode,
    estimate,
    photos,
  } = params;

  // 1. Resolve or create property — match by ZIP to avoid cross-property contamination
  //    (e.g. user manages primary home + rental at different ZIPs).
  let propertyId: string;
  const resolvedZip = zipCode.replace(/\D/g, "").slice(0, 5) || "00000";

  const { data: matchedProps } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_user_id", userId)
    .eq("postal_code", resolvedZip)
    .limit(1);

  if (matchedProps?.length) {
    // Reuse the existing property that matches this ZIP code.
    propertyId = matchedProps[0].id;
  } else {
    // No match for this ZIP — create a new property record for this location.
    const { data: prop, error: pErr } = await supabase
      .from("properties")
      .insert({
        owner_user_id: userId,
        postal_code: resolvedZip,
        city: "",
        state: "",
        country: "US",
        approximate_location:
          locationInput.length > 5 ? locationInput.trim() : null,
      })
      .select("id")
      .single();

    if (pErr || !prop) {
      throw new Error(pErr?.message || "Couldn't save your property.");
    }
    propertyId = prop.id;
  }

  // 2. Create project
  const estMin = estimate?.summary?.estimated_min_total;
  const estMax = estimate?.summary?.estimated_max_total;
  const conf = estimate?.summary?.confidence_score;

  const { data: proj, error: jErr } = await supabase
    .from("projects")
    .insert({
      property_id: propertyId,
      name: projectDisplayName(projectType),
      type: projectTypeToDb(projectType),
      stage: stageToDb(stage),
      estimated_min_total: Number.isFinite(estMin) ? estMin : null,
      estimated_max_total: Number.isFinite(estMax) ? estMax : null,
      confidence_score: Number.isFinite(conf) ? conf : null,
    })
    .select("id")
    .single();

  if (jErr || !proj) {
    throw new Error(jErr?.message || "Couldn't save your project.");
  }

  // 3. Insert scope items
  if (estimate?.scope_items?.length) {
    const rows = estimate.scope_items.map((s) => ({
      project_id: proj.id,
      category: s.category || "General",
      description: s.description || "",
      finish_tier: (s.finish_tier as "economy" | "mid" | "premium") || "mid",
      quantity: Number.isFinite(s.quantity) ? s.quantity : 0,
      unit: s.unit || "unit",
      unit_cost_min: Number.isFinite(s.unit_cost_min) ? s.unit_cost_min : 0,
      unit_cost_max: Number.isFinite(s.unit_cost_max) ? s.unit_cost_max : 0,
      total_cost_min: Number.isFinite(s.total_cost_min) ? s.total_cost_min : 0,
      total_cost_max: Number.isFinite(s.total_cost_max) ? s.total_cost_max : 0,
      confidence_score: Number.isFinite(s.confidence_score)
        ? s.confidence_score
        : 3,
      source: (s.source === "photo" ? "photo" : "text") as "photo" | "text",
      metadata: s.metadata,
    }));
    await supabase.from("scope_items").insert(rows);
  }

  // 4. Trigger photo-to-scope process if photos exist (async/background)
  if (photos.length > 0) {
    const fd = new FormData();
    fd.set("project_id", proj.id);
    fd.set("zip_code", zipCode);
    fd.set("room_type", projectTypeToRoomType(projectType));
    fd.set("finish_preference", "mid");
    photos.forEach((f) => fd.append("photos[]", f));

    // Fire-and-forget background re-estimate with photos
    invokeFunction("photo-to-scope", { body: fd }).catch((err: unknown) => {
      reportClientError("onboarding_photo_to_scope_background", err);
    });
  }

  return proj.id;
}
