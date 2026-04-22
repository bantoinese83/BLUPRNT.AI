import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { compressImageForAnalysis } from "@/lib/image-utils";
import { invokeFunction } from "@/lib/supabase";
import { getRangeForType } from "@/constants/estimateRanges";
import {
  projectTypeToRoomType,
  type PhotoToScopeResult,
  DEFAULT_ESTIMATE_CONFIDENCE,
  type ProjectTypeOption,
} from "@/lib/onboarding-helpers";
import {
  FALLBACK_REASON_CLIENT_TYPE_BENCHMARK,
  loadingScreenMessages,
  onboardingZipCode,
} from "@shared/constants/onboarding";

export type OnboardingEstimateState = {
  min: number;
  max: number;
  scope: PhotoToScopeResult["scope_items"];
  confidence: number;
  usedFallback?: boolean;
  fallbackReason?: string | null;
} | null;

type SetEstimate = React.Dispatch<
  React.SetStateAction<OnboardingEstimateState>
>;

/**
 * Photo-to-scope analysis (step 4), rotating status copy, and recovery actions.
 * Keeps analysis lifecycle out of the screen shell for easier testing and tweaks.
 */
export function useOnboardingAnalysis(
  step: number,
  projectType: ProjectTypeOption | null,
  location: string,
  scopeDescription: string,
  photos: string[],
  setEstimate: SetEstimate,
  setStep: (n: number) => void,
) {
  const [analysisAwaitingChoice, setAnalysisAwaitingChoice] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [analysisBarW, setAnalysisBarW] = useState(0);
  const analysisStepActiveRef = useRef(false);

  const analysisMessages = useMemo(
    () => loadingScreenMessages(projectType, location),
    [projectType, location],
  );

  const runAnalysis = useCallback(
    async (opts?: { textOnly?: boolean }) => {
      const textOnly = opts?.textOnly === true;
      setAnalysisAwaitingChoice(false);

      try {
        const photosForRequest = textOnly ? [] : photos;

        if (photosForRequest.length === 0 && !scopeDescription?.trim()) {
          if (textOnly) {
            Alert.alert(
              "Add a short description",
              "Go back one step and describe your project, or try analyzing your photos again.",
            );
            if (analysisStepActiveRef.current) setAnalysisAwaitingChoice(true);
            return;
          }
          if (!analysisStepActiveRef.current) return;
          const range = getRangeForType(projectType);
          setEstimate({
            min: range.min,
            max: range.max,
            scope: [],
            confidence: DEFAULT_ESTIMATE_CONFIDENCE,
            usedFallback: true,
            fallbackReason: FALLBACK_REASON_CLIENT_TYPE_BENCHMARK,
          });
          setStep(5);
          return;
        }

        const fd = new FormData();
        const zip = onboardingZipCode(location) || "00000";

        fd.append("zip_code", zip);
        fd.append("room_type", projectTypeToRoomType(projectType));
        fd.append("finish_preference", "mid");

        if (scopeDescription?.trim()) {
          fd.append("scope_description", scopeDescription.trim());
        }

        if (!textOnly) {
          const compressedUris = await Promise.all(
            photos.map((uri) => compressImageForAnalysis(uri)),
          );

          compressedUris.forEach((uri, index) => {
            // @ts-expect-error: React Native FormData needs this object format
            fd.append("photos[]", {
              uri,
              name: `vision_asset_${index}.jpg`,
              type: "image/jpeg",
            });
          });
        }

        const { data, error } = await invokeFunction<PhotoToScopeResult>(
          "photo-to-scope",
          { body: fd },
        );

        if (error || !data) {
          throw new Error(
            error && "message" in error
              ? String((error as { message: string }).message)
              : "AI Analysis failed",
          );
        }

        const result = data;
        if (!analysisStepActiveRef.current) return;
        setEstimate({
          min: result.summary.estimated_min_total,
          max: result.summary.estimated_max_total,
          scope: result.scope_items,
          confidence: Number.isFinite(result.summary.confidence_score)
            ? result.summary.confidence_score
            : DEFAULT_ESTIMATE_CONFIDENCE,
          usedFallback: Boolean(result.used_fallback),
          fallbackReason: result.fallback_reason ?? null,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep(5);
      } catch (err) {
        if (__DEV__) {
          console.warn("Onboarding analysis failed:", err);
        }
        if (!analysisStepActiveRef.current) return;
        setAnalysisAwaitingChoice(true);
      }
    },
    [location, projectType, scopeDescription, photos, setEstimate, setStep],
  );

  const runAnalysisRef = useRef(runAnalysis);
  runAnalysisRef.current = runAnalysis;

  const analysisMessagesLenRef = useRef(analysisMessages.length);
  analysisMessagesLenRef.current = analysisMessages.length;

  const handleAnalysisRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void runAnalysisRef.current();
  }, []);

  const handleAnalysisTextOnly = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void runAnalysisRef.current({ textOnly: true });
  }, []);

  const handleAnalysisRegionalFallback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!analysisStepActiveRef.current) return;
    const range = getRangeForType(projectType);
    setEstimate({
      min: range.min,
      max: range.max,
      scope: [],
      confidence: DEFAULT_ESTIMATE_CONFIDENCE,
      usedFallback: true,
      fallbackReason: FALLBACK_REASON_CLIENT_TYPE_BENCHMARK,
    });
    setAnalysisAwaitingChoice(false);
    setStep(5);
  }, [projectType, setEstimate, setStep]);

  useEffect(() => {
    if (step !== 4) return;

    analysisStepActiveRef.current = true;
    setAnalysisAwaitingChoice(false);
    setAnalysisIndex(0);
    let current = 0;
    const messageInterval = setInterval(() => {
      const len = Math.max(1, analysisMessagesLenRef.current);
      current = (current + 1) % len;
      setAnalysisIndex(current);
    }, 2500);

    void runAnalysisRef.current();

    return () => {
      analysisStepActiveRef.current = false;
      clearInterval(messageInterval);
    };
  }, [step]);

  const analysisBarTargetW = analysisBarW > 0 ? analysisBarW : 280;

  return {
    analysisAwaitingChoice,
    analysisIndex,
    setAnalysisBarW,
    analysisBarTargetW,
    analysisMessages,
    handleAnalysisRetry,
    handleAnalysisTextOnly,
    handleAnalysisRegionalFallback,
  };
}
