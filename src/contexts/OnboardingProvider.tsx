import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { PhotoToScopeResult } from "@/types/estimate";
import type {
  ProjectTypeOption,
  StageOption,
} from "@/types/onboarding";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  DEFAULT_ESTIMATE_CONFIDENCE,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_MIN,
  projectDisplayName,
  projectTypeToDb,
  projectTypeToRoomType,
  saveOnboardingProject,
  stageToDb,
} from "@/lib/onboarding-helpers";
import { OnboardingContext } from "./onboarding-context";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [projectType, setProjectType] = useState<ProjectTypeOption | null>(
    null,
  );
  const [locationInput, setLocationInput] = useState("");
  const [locationUnset, setLocationUnset] = useState(false);
  const [scopeDescription, setScopeDescription] = useState("");
  const [stage, setStage] = useState<StageOption | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [estimate, setEstimate] = useState<PhotoToScopeResult | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);

  const zipFromLocation = useCallback(() => {
    const digits = locationInput.replace(/\D/g, "").slice(0, 5);
    return digits.length === 5 ? digits : locationInput.trim() || "00000";
  }, [locationInput]);

  const runPhotoToScope = useCallback(async () => {
    setEstimateError(null);
    setEstimateLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setEstimate({
          project_id: null,
          summary: {
            estimated_min_total: DEFAULT_ESTIMATE_MIN,
            estimated_max_total: DEFAULT_ESTIMATE_MAX,
            confidence_score: DEFAULT_ESTIMATE_CONFIDENCE,
          },
          scope_items: [
            {
              id: "scope_1",
              category: "Sample",
              description: "Connect your account to load a real estimate.",
              finish_tier: "mid",
              quantity: 1,
              unit: "job",
              unit_cost_min: null,
              unit_cost_max: null,
              total_cost_min: DEFAULT_ESTIMATE_MIN,
              total_cost_max: DEFAULT_ESTIMATE_MAX,
              confidence_score: 4,
              source: "text",
            },
          ],
          explanations: [
            "Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable estimates from our service.",
          ],
          area_label: "your area",
        });
        return;
      }

      const formData = new FormData();
      formData.set("zip_code", zipFromLocation());
      formData.set("room_type", projectTypeToRoomType(projectType));
      formData.set("finish_preference", "mid");
      formData.set("location_unset", locationUnset ? "1" : "0");
      if (scopeDescription.trim())
        formData.set("scope_description", scopeDescription.trim());
      photos.forEach((f) => formData.append("photos[]", f));

      const { data, error } =
        await supabase.functions.invoke<PhotoToScopeResult>("photo-to-scope", {
          body: formData,
        });

      if (error) {
        const msg =
          typeof error === "object" && error !== null && "message" in error
            ? String((error as { message?: string }).message)
            : "We couldn’t build your estimate. Try again.";
        setEstimateError(msg);
        return;
      }
      if (data && typeof data === "object" && "summary" in data) {
        setEstimate(data as PhotoToScopeResult);
      } else {
        setEstimateError("Something went wrong. Please try again.");
      }
    } catch {
      setEstimateError("Connection issue. Check your network and try again.");
    } finally {
      setEstimateLoading(false);
    }
  }, [photos, projectType, zipFromLocation, locationUnset, scopeDescription]);

  const persistProjectAfterSignIn = useCallback(
    async (params: { email: string; password: string }) => {
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
            signErr.message || "Couldn't sign in. Check your email and password.",
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
          projectType,
          stage,
          locationInput,
          zipCode: zipFromLocation(),
          estimate,
          photos,
        });

        setSavedProjectId(projectId);
        localStorage.setItem("blueprintai_project_id", projectId);
        return { ok: true, message: "Project saved." };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Couldn't save project.",
        };
      }
    },
    [estimate, locationInput, photos, projectType, stage, zipFromLocation],
  );

  const persistProjectAfterSignup = useCallback(
    async (params: { email: string; password: string }) => {
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
          projectType,
          stage,
          locationInput,
          zipCode: zipFromLocation(),
          estimate,
          photos,
        });

        setSavedProjectId(projectId);
        localStorage.setItem("blueprintai_project_id", projectId);
        return { ok: true, message: "You’re all set." };
      } catch (err) {
        return {
          ok: false,
          message:
            err instanceof Error ? err.message : "Couldn't save your data.",
        };
      }
    },
    [estimate, locationInput, photos, projectType, stage, zipFromLocation],
  );

  const clearOnboarding = useCallback(() => {
    setProjectType(null);
    setLocationInput("");
    setLocationUnset(false);
    setScopeDescription("");
    setStage(null);
    setPhotos([]);
    setEstimate(null);
    setEstimateError(null);
    setSavedProjectId(null);
  }, []);

  const value = useMemo(
    () => ({
      projectType,
      setProjectType,
      locationInput,
      setLocationInput,
      locationUnset,
      setLocationUnset,
      scopeDescription,
      setScopeDescription,
      stage,
      setStage,
      photos,
      setPhotos,
      estimate,
      estimateError,
      estimateLoading,
      runPhotoToScope,
      persistProjectAfterSignup,
      persistProjectAfterSignIn,
      savedProjectId,
      clearOnboarding,
      projectTypeToDb,
      stageToDb,
      projectDisplayName,
    }),
    [
      projectType,
      locationInput,
      locationUnset,
      scopeDescription,
      stage,
      photos,
      estimate,
      estimateError,
      estimateLoading,
      runPhotoToScope,
      persistProjectAfterSignup,
      persistProjectAfterSignIn,
      savedProjectId,
      clearOnboarding,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
