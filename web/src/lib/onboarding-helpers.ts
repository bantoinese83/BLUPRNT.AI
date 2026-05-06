import { type SupabaseClient } from "@supabase/supabase-js";
import { invokeFunction } from "./supabase";
import { reportClientError } from "@/lib/sentry";
import {
  projectTypeToRoomType,
  type ProjectTypeOption,
  type StageOption,
} from "@shared/lib/onboarding-helpers";
import { sharedSaveOnboardingProject } from "@shared/lib/onboarding-logic";
import type { OnboardingPhotoToScopeResult } from "@shared/types/onboarding";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing.js";

/**
 * Persists an onboarding project to Supabase and triggers vision analysis if photos exist.
 * Uses shared core logic for DB operations to ensure cross-platform consistency.
 */
export async function saveOnboardingProject(params: {
  supabase: SupabaseClient;
  userId: string;
  projectType: ProjectTypeOption | null;
  stage: StageOption | null;
  locationInput: string;
  zipCode: string;
  estimate: OnboardingPhotoToScopeResult | null;
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

  // 1. Core persistence (Property -> Project -> Scope Items)
  const projectId = await sharedSaveOnboardingProject({
    supabase,
    userId,
    projectType,
    stage,
    locationInput,
    zipCode,
    estimate,
  });

  // 2. Platform-specific: Background vision analysis
  if (photos.length > 0) {
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("zip_code", zipCode);
    fd.set("room_type", projectTypeToRoomType(projectType));
    fd.set("finish_preference", "mid");
    photos.forEach((f) => fd.append("photos[]", f));

    // Fire-and-forget background re-estimate with photos
    invokeFunction(EDGE_FUNCTIONS.PHOTO_TO_SCOPE, { body: fd }).catch(
      (err: unknown) => {
        reportClientError("onboarding_photo_to_scope_background", err);
      },
    );
  }

  return projectId;
}

export {
  DEFAULT_ESTIMATE_MIN,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_CONFIDENCE,
  projectTypeToRoomType,
  projectTypeToDb,
  stageToDb,
  projectDisplayName,
} from "@shared/lib/onboarding-helpers";
export type { PhotoToScopeResult } from "@/types/estimate";
