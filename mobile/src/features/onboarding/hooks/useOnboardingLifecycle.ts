import { useEffect } from "react";
import { router } from "expo-router";
import { supabase } from "../../../lib/supabase";
import {
  loadOnboardingDraft,
  clearOnboardingDraft,
} from "../../../lib/onboarding-draft";
import {
  normalizeStageFromDraft,
  type ProjectTypeOption,
  type StageOption,
} from "../../../lib/onboarding-helpers";
import type { OnboardingEstimateState } from "./useOnboardingAnalysis";

/**
 * Fast-track existing users with projects, draft clearing for “new project”,
 * and post-auth draft restore — isolated from step UI.
 */
export function useOnboardingLifecycle({
  userId,
  sessionUserId,
  isAddingAnotherProject,
  restoreOnboarding,
  setProjectType,
  setLocation,
  setStage,
  setPhotos,
  setScopeDescription,
  setEstimate,
  setStep,
}: {
  userId: string | undefined;
  sessionUserId: string | undefined;
  isAddingAnotherProject: boolean;
  restoreOnboarding: string | undefined;
  setProjectType: (v: ProjectTypeOption | null) => void;
  setLocation: (v: string) => void;
  setStage: (v: StageOption | null) => void;
  setPhotos: (v: string[]) => void;
  setScopeDescription: (v: string) => void;
  setEstimate: (v: OnboardingEstimateState) => void;
  setStep: (n: number) => void;
}) {
  useEffect(() => {
    if (isAddingAnotherProject || !userId) return;

    let cancelled = false;
    void (async () => {
      const { data: props } = await supabase
        .from("properties")
        .select("id")
        .eq("owner_user_id", userId);

      const propIds = (props || []).map((p) => p.id);
      if (propIds.length === 0) return;

      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .in("property_id", propIds);

      if (cancelled) return;
      if (!error && count && count > 0) {
        router.replace("/(tabs)");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, isAddingAnotherProject]);

  useEffect(() => {
    if (isAddingAnotherProject) {
      void clearOnboardingDraft();
    }
  }, [isAddingAnotherProject]);

  useEffect(() => {
    if (restoreOnboarding !== "1" || !sessionUserId) return;

    let cancelled = false;
    void (async () => {
      const draft = await loadOnboardingDraft();
      if (cancelled || !draft) return;
      setProjectType(draft.projectType);
      setLocation(draft.location);
      setStage(normalizeStageFromDraft(String(draft.stage ?? "")));
      setPhotos(draft.photos);
      setScopeDescription(draft.scopeDescription);
      setEstimate(
        draft.estimate
          ? {
              min: draft.estimate.min,
              max: draft.estimate.max,
              scope: draft.estimate.scope,
              confidence: draft.estimate.confidence,
            }
          : null,
      );
      setStep(6);
      await clearOnboardingDraft();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    restoreOnboarding,
    sessionUserId,
    setProjectType,
    setLocation,
    setStage,
    setPhotos,
    setScopeDescription,
    setEstimate,
    setStep,
  ]);
}
