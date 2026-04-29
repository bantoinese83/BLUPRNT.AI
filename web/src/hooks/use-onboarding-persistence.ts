import { useCallback, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { saveOnboardingProject } from "@/lib/onboarding-helpers";
import type { PhotoToScopeResult } from "@/types/estimate";
import type { ProjectTypeOption, StageOption } from "@/types/onboarding";

export function useOnboardingPersistence() {
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);

  const persistProject = useCallback(
    async (params: {
      projectType: ProjectTypeOption | null;
      stage: StageOption | null;
      locationInput: string;
      zipCode: string;
      estimate: PhotoToScopeResult | null;
      photos: File[];
    }) => {
      if (!isSupabaseConfigured()) {
        return {
          ok: false,
          message: "We're having trouble connecting. Please try again later.",
        };
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        return {
          ok: false,
          message: "No active session found. Please sign in.",
        };
      }

      try {
        const projectId = await saveOnboardingProject({
          supabase,
          userId: session.user.id,
          projectType: params.projectType,
          stage: params.stage,
          locationInput: params.locationInput,
          zipCode: params.zipCode,
          estimate: params.estimate,
          photos: params.photos,
        });

        setSavedProjectId(projectId);
        localStorage.setItem("bluprnt_project_id", projectId);
        return { ok: true, message: "Project saved to your account." };
      } catch (err) {
        return {
          ok: false,
          message:
            err instanceof Error ? err.message : "Couldn't save project.",
        };
      }
    },
    [],
  );

  return {
    savedProjectId,
    setSavedProjectId,
    persistProject,
  };
}
