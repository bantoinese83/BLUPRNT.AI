import { type SupabaseClient } from "@supabase/supabase-js";
import {
  projectDisplayName,
  projectTypeToDb,
  stageToDb,
  type ProjectTypeOption,
  type StageOption,
} from "./onboarding-helpers.ts";
import type { OnboardingPhotoToScopeResult } from "../types/onboarding.ts";

/**
 * Shared core logic to persist an onboarding project to Supabase.
 * Extracted to ensure Web and Mobile behave identically during initialization.
 */
export async function sharedSaveOnboardingProject(params: {
  supabase: SupabaseClient;
  userId: string;
  projectType: ProjectTypeOption | null;
  stage: StageOption | null;
  locationInput: string;
  zipCode: string;
  estimate: OnboardingPhotoToScopeResult | null;
}) {
  const {
    supabase,
    userId,
    projectType,
    stage,
    locationInput,
    zipCode,
    estimate,
  } = params;

  // 1. Resolve or create property
  let propertyId: string;
  const resolvedZip = zipCode.replace(/\D/g, "").slice(0, 5) || "00000";

  const { data: matchedProps } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_user_id", userId)
    .eq("postal_code", resolvedZip)
    .limit(1);

  if (matchedProps && matchedProps[0]) {
    propertyId = matchedProps[0].id;
  } else {
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
    const rows = estimate.scope_items.map((s) => {
      const nested = s.metadata;
      const fromMeta = Array.isArray(nested?.materials) ? nested.materials : [];
      const fromTop = Array.isArray(s.materials) ? s.materials : [];
      const materials = fromMeta.length > 0 ? fromMeta : fromTop;

      const justification =
        (s.justification ?? nested?.justification ?? "").trim() || null;
      const priority = (s.priority ?? nested?.priority ?? "medium") as
        | "high"
        | "medium"
        | "low";
      const phase = (s.phase ?? nested?.phase ?? "").trim() || null;
      const maintenanceTips =
        (s.maintenance_tips ?? nested?.maintenance_tips ?? "").trim() || null;
      const confidenceReason =
        (s.confidence_reason ?? nested?.confidence_reason ?? "").trim() || null;

      return {
        project_id: proj.id,
        category: s.category || "General",
        description: s.description || "",
        finish_tier: (s.finish_tier as "economy" | "mid" | "premium") || "mid",
        justification,
        priority,
        phase,
        maintenance_tips: maintenanceTips,
        confidence_reason: confidenceReason,
        verification_required: Boolean(s.verification_required),
        quantity: Number.isFinite(s.quantity) ? s.quantity : 0,
        unit: s.unit || "unit",
        unit_cost_min: Number.isFinite(s.unit_cost_min) ? s.unit_cost_min : 0,
        unit_cost_max: Number.isFinite(s.unit_cost_max) ? s.unit_cost_max : 0,
        total_cost_min: Number.isFinite(s.total_cost_min)
          ? s.total_cost_min
          : 0,
        total_cost_max: Number.isFinite(s.total_cost_max)
          ? s.total_cost_max
          : 0,
        confidence_score: Number.isFinite(s.confidence_score)
          ? s.confidence_score
          : 3,
        source: (s.source === "photo" ? "photo" : "text") as "photo" | "text",
        metadata: {
          justification: justification ?? "",
          priority,
          phase: phase ?? "",
          maintenance_tips: maintenanceTips ?? "",
          confidence_reason: confidenceReason ?? "",
          materials,
        },
      };
    });
    const { error: scopeErr } = await supabase.from("scope_items").insert(rows);
    if (scopeErr) {
      throw new Error(scopeErr.message || "Couldn't save your scope items.");
    }
  }

  return proj.id;
}
