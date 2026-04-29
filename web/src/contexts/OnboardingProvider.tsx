import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { ProjectTypeOption, StageOption } from "@/types/onboarding";
import {
  projectDisplayName,
  projectTypeToDb,
  stageToDb,
} from "@/lib/onboarding-helpers";
import { OnboardingContext } from "./onboarding-context";
import { useLocalStorage } from "@/hooks/use-local-storage";

import { useOnboardingPersistence } from "@/hooks/use-onboarding-persistence";
import { useOnboardingAuthPersistence } from "@/hooks/use-onboarding-auth-persistence";
import { useOnboardingEstimation } from "@/hooks/use-onboarding-estimation";
import { useOnboardingSync } from "@/hooks/use-onboarding-sync";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [projectType, setProjectType] =
    useLocalStorage<ProjectTypeOption | null>("bluprnt_onboarding_type", null);
  const [locationInput, setLocationInput] = useLocalStorage(
    "bluprnt_onboarding_location",
    "",
  );
  const [locationUnset, setLocationUnset] = useLocalStorage(
    "bluprnt_onboarding_location_unset",
    false,
  );
  const [scopeDescription, setScopeDescription] = useLocalStorage(
    "bluprnt_onboarding_scope",
    "",
  );
  const [stage, setStage] = useLocalStorage<StageOption | null>(
    "bluprnt_onboarding_stage",
    null,
  );

  const [photos, setPhotos] = useState<File[]>([]);

  const zipFromLocation = useCallback(() => {
    const lStr = String(locationInput || "");
    const digits = lStr.replace(/\D/g, "").slice(0, 5);
    return digits.length === 5 ? digits : lStr.trim() || "00000";
  }, [locationInput]);

  const {
    estimate,
    setEstimate,
    estimateError,
    setEstimateError,
    estimateLoading,
    onboardingContext,
    runPhotoToScope,
    fetchOnboardingContext,
  } = useOnboardingEstimation({
    projectType,
    locationUnset,
    scopeDescription,
    photos,
    zipFromLocation,
  });

  const {
    savedProjectId,
    setSavedProjectId,
    persistProject: hookPersistProject,
  } = useOnboardingPersistence();
  const {
    persistProjectAfterSignIn: hookPersistSignIn,
    persistProjectAfterSignup: hookPersistSignup,
  } = useOnboardingAuthPersistence(setSavedProjectId);

  useOnboardingSync({
    setProjectType,
    setLocationInput,
    setStage,
    setScopeDescription,
    setEstimate,
  });

  const persistProject = useCallback(() => {
    return hookPersistProject({
      projectType,
      stage,
      locationInput,
      zipCode: zipFromLocation(),
      estimate,
      photos,
    });
  }, [
    hookPersistProject,
    projectType,
    stage,
    locationInput,
    zipFromLocation,
    estimate,
    photos,
  ]);

  const persistProjectAfterSignIn = useCallback(
    (params: { email: string; password: string }) => {
      return hookPersistSignIn({
        ...params,
        projectType,
        stage,
        locationInput,
        zipCode: zipFromLocation(),
        estimate,
        photos,
      });
    },
    [
      hookPersistSignIn,
      projectType,
      stage,
      locationInput,
      zipFromLocation,
      estimate,
      photos,
    ],
  );

  const persistProjectAfterSignup = useCallback(
    (params: { email: string; password: string }) => {
      return hookPersistSignup({
        ...params,
        projectType,
        stage,
        locationInput,
        zipCode: zipFromLocation(),
        estimate,
        photos,
      });
    },
    [
      hookPersistSignup,
      projectType,
      stage,
      locationInput,
      zipFromLocation,
      estimate,
      photos,
    ],
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

    localStorage.removeItem("bluprnt_onboarding_type");
    localStorage.removeItem("bluprnt_onboarding_location");
    localStorage.removeItem("bluprnt_onboarding_location_unset");
    localStorage.removeItem("bluprnt_onboarding_scope");
    localStorage.removeItem("bluprnt_onboarding_stage");
    sessionStorage.removeItem("bluprnt_pending_estimate");
  }, [
    setProjectType,
    setLocationInput,
    setLocationUnset,
    setScopeDescription,
    setStage,
    setEstimate,
    setEstimateError,
    setSavedProjectId,
  ]);

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
      onboardingContext,
      fetchOnboardingContext,
      runPhotoToScope,
      persistProject,
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
      estimate,
      estimateError,
      estimateLoading,
      onboardingContext,
      fetchOnboardingContext,
      runPhotoToScope,
      persistProject,
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
