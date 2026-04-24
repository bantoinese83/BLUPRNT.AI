import { type SupabaseClient } from "@supabase/supabase-js";
import { compressImageForAnalysis } from "@/lib/image-utils";
import { invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import {
  projectTypeToRoomType,
  type ProjectTypeOption,
  type StageOption,
} from "@shared/lib/onboarding-helpers";
import { sharedSaveOnboardingProject } from "@shared/lib/onboarding-logic";
import type {
  OnboardingPhotoToScopeResult,
  OnboardingScopeItem,
} from "@shared/types/onboarding";

// Export types for mobile app consumption
export type { ProjectTypeOption, StageOption };
export type ScopeItem = OnboardingScopeItem;
export type PhotoToScopeResult = OnboardingPhotoToScopeResult;

/** Thrown when JWT exists locally but auth.users row is gone (e.g. account deleted server-side). */
export const ONBOARDING_SESSION_INVALID = "ONBOARDING_SESSION_INVALID";

export interface PhotoAsset {
  uri: string;
}

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

  // 1. Mobile-specific: Reconcile session with server to avoid FK errors
  const {
    data: { user: verifiedUser },
    error: verifyErr,
  } = await supabase.auth.getUser();
  if (verifyErr || !verifiedUser || verifiedUser.id !== userId) {
    throw new Error(ONBOARDING_SESSION_INVALID);
  }

  // 2. Core persistence (Property -> Project -> Scope Items)
  const projectId = await sharedSaveOnboardingProject({
    supabase,
    userId,
    projectType,
    stage,
    locationInput,
    zipCode,
    estimate,
  });

  // 3. Platform-specific: Background vision analysis
  if (photos.length > 0 && !estimate?.scope_items?.length) {
    const compressedUris = await Promise.all(
      photos.map((p) => compressImageForAnalysis(p.uri)),
    );

    const fd = new FormData();
    fd.append("project_id", projectId);
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

    invokeFunction("photo-to-scope", { body: fd }).catch((err: unknown) => {
      reportClientError("onboarding_photo_to_scope_background", err);
    });
  }

  return projectId;
}

export {
  DEFAULT_ESTIMATE_MIN,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_CONFIDENCE,
  normalizeStageFromDraft,
  projectTypeToRoomType,
  projectTypeToDb,
  stageToDb,
  projectDisplayName,
} from "@shared/lib/onboarding-helpers";
