import { SupabaseClient } from "@supabase/supabase-js";
import { compressImageForAnalysis } from "./image-utils";
import { invokeFunction } from "./supabase";

export type ProjectTypeOption =
  | "Kitchen"
  | "Bathroom"
  | "Painting"
  | "Roof"
  | "Flooring"
  | "Something else";
export type StageOption =
  | "Just planning"
  | "Collecting quotes"
  | "Already started work";

/** Migrate drafts saved before stage labels were aligned with web. */
export function normalizeStageFromDraft(
  raw: string | null | undefined,
): StageOption | null {
  if (!raw) return null;
  if (raw === "Planning & budgeting") return "Just planning";
  const valid: StageOption[] = [
    "Just planning",
    "Collecting quotes",
    "Already started work",
  ];
  return valid.includes(raw as StageOption) ? (raw as StageOption) : null;
}

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
  const m: Record<
    string,
    "kitchen" | "bath" | "paint" | "roof" | "flooring" | "other"
  > = {
    Kitchen: "kitchen",
    Bathroom: "bath",
    Painting: "paint",
    Roof: "roof",
    Flooring: "flooring",
    "Something else": "other",
  };
  return t ? (m[t] ?? "other") : "other";
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

export interface ScopeItem {
  category: string;
  description: string;
  finish_tier?: string;
  quantity: number;
  unit: string;
  unit_cost_min: number;
  unit_cost_max: number;
  total_cost_min: number;
  total_cost_max: number;
  confidence_score: number;
  source?: "text" | "photo" | "fallback";
  metadata?: {
    materials?: Array<{
      name: string;
      brand?: string;
      quantity?: number | string;
      unit?: string;
    }>;
  };
}

export interface PhotoToScopeResult {
  summary: {
    estimated_min_total: number;
    estimated_max_total: number;
    confidence_score: number;
  };
  scope_items: ScopeItem[];
}

export interface PhotoAsset {
  uri: string;
}

/** DB `scope_items.source` check allows only text | photo; API may send `fallback`. */
function normalizeScopeSourceForDb(
  source: string | undefined | null,
): "text" | "photo" {
  if (source === "photo") return "photo";
  return "text";
}

/** Thrown when JWT exists locally but auth.users row is gone (e.g. account deleted server-side). */
export const ONBOARDING_SESSION_INVALID = "ONBOARDING_SESSION_INVALID";

export async function saveOnboardingProject(params: {
  supabase: SupabaseClient;
  userId: string;
  projectType: ProjectTypeOption | null;
  stage: StageOption | null;
  locationInput: string;
  zipCode: string;
  estimate: PhotoToScopeResult | null;
  photos: PhotoAsset[];
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

  // Reconcile with server: stale AsyncStorage sessions survive auth.users deletion (FK errors otherwise).
  const {
    data: { user: verifiedUser },
    error: verifyErr,
  } = await supabase.auth.getUser();
  if (verifyErr || !verifiedUser || verifiedUser.id !== userId) {
    throw new Error(ONBOARDING_SESSION_INVALID);
  }

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

  // 3. Insert scope items (align with Edge + DB: BOM lives in metadata.materials)
  if (estimate?.scope_items?.length) {
    type ScopeRowIn = (typeof estimate.scope_items)[number] & {
      justification?: string | null;
      priority?: string | null;
      phase?: string | null;
      maintenance_tips?: string | null;
      confidence_reason?: string | null;
      verification_required?: boolean | null;
    };

    const normalizePriority = (
      p: string | null | undefined,
    ): "high" | "medium" | "low" => {
      if (p === "high" || p === "low" || p === "medium") return p;
      return "medium";
    };

    const rows = estimate.scope_items.map((raw) => {
      const s = raw as ScopeRowIn;
      const nested = s.metadata as Record<string, unknown> | undefined;
      const fromNested = nested?.materials;
      const fromShallow = s.metadata?.materials;
      const materials = Array.isArray(fromNested)
        ? fromNested
        : Array.isArray(fromShallow)
          ? fromShallow
          : [];

      const justification =
        (
          s.justification ??
          (typeof nested?.justification === "string"
            ? nested.justification
            : "") ??
          ""
        ).trim() || null;
      const priority = normalizePriority(
        s.priority ??
          (typeof nested?.priority === "string" ? nested.priority : undefined),
      );
      const phase =
        (
          s.phase ??
          (typeof nested?.phase === "string" ? nested.phase : "") ??
          ""
        ).trim() || null;
      const maintenanceTips =
        (
          s.maintenance_tips ??
          (typeof nested?.maintenance_tips === "string"
            ? nested.maintenance_tips
            : "") ??
          ""
        ).trim() || null;
      const confidenceReason =
        (
          s.confidence_reason ??
          (typeof nested?.confidence_reason === "string"
            ? nested.confidence_reason
            : "") ??
          ""
        ).trim() || null;

      return {
        project_id: proj.id,
        category: s.category || "General",
        description: s.description || "",
        finish_tier: s.finish_tier || "mid",
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
        source: normalizeScopeSourceForDb(s.source),
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
      throw new Error(
        scopeErr.message || "Couldn't save your scope. Please try again.",
      );
    }
  }

  // 4. Background vision only when onboarding did not persist line items (avoids
  // wiping scope via photo-to-scope is_initial_analysis default + duplicate Gemini).
  if (photos.length > 0 && !estimate?.scope_items?.length) {
    const compressedUris = await Promise.all(
      photos.map((p) => compressImageForAnalysis(p.uri)),
    );

    const fd = new FormData();
    fd.append("project_id", proj.id);
    fd.append("zip_code", zipCode);
    fd.append("room_type", projectTypeToRoomType(projectType));
    fd.append("finish_preference", "mid");

    compressedUris.forEach((uri, index) => {
      fd.append("photos[]", {
        uri,
        name: `photo_${index}.jpg`,
        type: "image/jpeg",
      } as unknown as string);
    });

    invokeFunction("photo-to-scope", { body: fd }).catch((err) => {
      console.error("[saveOnboardingProject] Background analysis failed:", err);
    });
  }

  return proj.id;
}
