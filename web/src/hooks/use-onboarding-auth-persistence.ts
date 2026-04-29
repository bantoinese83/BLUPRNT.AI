import { useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { saveOnboardingProject } from "@/lib/onboarding-helpers";
import type { PhotoToScopeResult } from "@/types/estimate";
import type { ProjectTypeOption, StageOption } from "@/types/onboarding";

export function useOnboardingAuthPersistence(
  setSavedProjectId: (id: string | null) => void,
) {
  const persistProjectAfterSignIn = useCallback(
    async (params: {
      email: string;
      password: string;
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
      const { email, password } = params;
      const { data: auth, error: signErr } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      if (signErr) {
        return {
          ok: false,
          message:
            signErr.message ||
            "Couldn't sign in. Check your email and password.",
        };
      }
      if (!auth.session?.user) {
        return {
          ok: false,
          message: "Sign-in didn't complete. Please try again.",
        };
      }

      try {
        const projectId = await saveOnboardingProject({
          supabase,
          userId: auth.session.user.id,
          projectType: params.projectType,
          stage: params.stage,
          locationInput: params.locationInput,
          zipCode: params.zipCode,
          estimate: params.estimate,
          photos: params.photos,
        });

        setSavedProjectId(projectId);
        localStorage.setItem("bluprnt_project_id", projectId);
        return { ok: true, message: "Project saved." };
      } catch (err) {
        return {
          ok: false,
          message:
            err instanceof Error ? err.message : "Couldn't save project.",
        };
      }
    },
    [setSavedProjectId],
  );

  const persistProjectAfterSignup = useCallback(
    async (params: {
      email: string;
      password: string;
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
      const { email, password } = params;
      const { data: auth, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signErr) {
        return {
          ok: false,
          message: signErr.message || "Couldn’t create your account.",
        };
      }

      let session = auth.session;
      if (!session && auth.user) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        session = signInData.session;
      }

      if (!session?.user) {
        return {
          ok: false,
          message:
            "Finish signing in: confirm your email if asked, or in Supabase turn off “Confirm email” (Auth → Email) for instant setup, then try again.",
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
        return { ok: true, message: "You’re all set." };
      } catch (err) {
        return {
          ok: false,
          message:
            err instanceof Error ? err.message : "Couldn't save your data.",
        };
      }
    },
    [setSavedProjectId],
  );

  return {
    persistProjectAfterSignIn,
    persistProjectAfterSignup,
  };
}
