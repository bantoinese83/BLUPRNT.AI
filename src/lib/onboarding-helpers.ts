import { SupabaseClient } from "@supabase/supabase-js";
import type { PhotoToScopeResult } from "@/types/estimate";
import type { ProjectTypeOption, StageOption } from "@/types/onboarding";

export const DEFAULT_ESTIMATE_MIN = 24000;
export const DEFAULT_ESTIMATE_MAX = 31000;
export const DEFAULT_ESTIMATE_CONFIDENCE = 4.5;

export function projectTypeToRoomType(t: ProjectTypeOption | null): string {
  if (t === "Kitchen") return "kitchen";
  if (t === "Bathroom") return "bathroom";
  return "other";
}

export function projectTypeToDb(
  t: ProjectTypeOption | null,
): "kitchen" | "bath" | "paint" | "roof" | "flooring" | "other" {
  const m: Record<string, "kitchen" | "bath" | "paint" | "roof" | "flooring" | "other"> = {
    Kitchen: "kitchen",
    Bathroom: "bath",
    Painting: "paint",
    Roof: "roof",
    Flooring: "flooring",
    "Something else": "other",
  };
  return t ? m[t] ?? "other" : "other";
}

export function stageToDb(
  s: StageOption | null,
): "planning" | "collecting_quotes" | "in_progress" | "completed" {
  if (s === "Collecting quotes") return "collecting_quotes";
  if (s === "Already started work") return "in_progress";
  return "planning";
}

export function projectDisplayName(t: ProjectTypeOption | null): string {
  if (!t || t === "Something else") return "My project";
  return `${t} project`;
}

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

  // 1. Resolve or create property
  let propertyId: string;
  const { data: existingProps } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1);

  if (existingProps?.length) {
    propertyId = existingProps[0].id;
  } else {
    const { data: prop, error: pErr } = await supabase
      .from("properties")
      .insert({
        owner_user_id: userId,
        postal_code: zipCode,
        city: "",
        state: "",
        country: "US",
        approximate_location: locationInput.length > 5 ? locationInput.trim() : null,
      })
      .select("id")
      .single();

    if (pErr || !prop) {
      throw new Error(pErr?.message || "Couldn't save your property.");
    }
    propertyId = prop.id;
  }

  // 2. Create project
  const { data: proj, error: jErr } = await supabase
    .from("projects")
    .insert({
      property_id: propertyId,
      name: projectDisplayName(projectType),
      type: projectTypeToDb(projectType),
      stage: stageToDb(stage),
      estimated_min_total: estimate?.summary.estimated_min_total ?? null,
      estimated_max_total: estimate?.summary.estimated_max_total ?? null,
      confidence_score: estimate?.summary.confidence_score ?? null,
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
      category: s.category,
      description: s.description,
      finish_tier: (s.finish_tier as "economy" | "mid" | "premium") || "mid",
      quantity: s.quantity,
      unit: s.unit,
      unit_cost_min: s.unit_cost_min,
      unit_cost_max: s.unit_cost_max,
      total_cost_min: s.total_cost_min,
      total_cost_max: s.total_cost_max,
      confidence_score: s.confidence_score,
      source: (s.source === "photo" ? "photo" : "text") as "photo" | "text",
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
    // Don't await this if we want to return quick, but here it's fine
    supabase.functions.invoke("photo-to-scope", { body: fd });
  }

  return proj.id;
}
