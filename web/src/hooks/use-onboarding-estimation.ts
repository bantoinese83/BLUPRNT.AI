import { useCallback, useState } from "react";
import { invokeFunction, isSupabaseConfigured } from "@/lib/supabase";
import { userFriendlyEstimateError } from "@/lib/onboarding-estimate-errors";
import {
  DEFAULT_ESTIMATE_CONFIDENCE,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_MIN,
  projectTypeToRoomType,
} from "@/lib/onboarding-helpers";
import type { PhotoToScopeResult } from "@/types/estimate";
import type { ProjectTypeOption } from "@/types/onboarding";

export function useOnboardingEstimation(params: {
  projectType: ProjectTypeOption | null;
  locationUnset: boolean;
  scopeDescription: string;
  photos: File[];
  zipFromLocation: () => string;
}) {
  const [estimate, setEstimate] = useState<PhotoToScopeResult | null>(() => {
    try {
      const raw = sessionStorage.getItem("bluprnt_pending_estimate");
      return raw ? (JSON.parse(raw) as PhotoToScopeResult) : null;
    } catch {
      return null;
    }
  });
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [onboardingContext, setOnboardingContext] = useState<{
    status_messages: string[];
    market_bulletin: string;
    value_tips: string[];
  } | null>(null);

  const runPhotoToScope = useCallback(
    async (opts?: { textOnly?: boolean; maxRetries?: number }) => {
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
        formData.set("zip_code", params.zipFromLocation());
        formData.set("room_type", projectTypeToRoomType(params.projectType));
        formData.set("finish_preference", "mid");
        formData.set("location_unset", params.locationUnset ? "1" : "0");
        if (String(params.scopeDescription || "").trim())
          formData.set(
            "scope_description",
            String(params.scopeDescription).trim(),
          );
        if (!opts?.textOnly) {
          params.photos.forEach((f) => formData.append("photos[]", f));
        }

        const retries = Math.max(0, Math.min(opts?.maxRetries ?? 1, 3));
        let data: PhotoToScopeResult | null = null;
        let error: unknown = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
          const result = await invokeFunction<PhotoToScopeResult>(
            "photo-to-scope",
            {
              body: formData,
            },
          );
          data = result.data ?? null;
          error = result.error;
          if (!error) break;
          if (attempt < retries) {
            const backoffMs = Math.min(2500, 300 * 2 ** attempt);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }

        if (error) {
          const msg =
            typeof error === "object" && error !== null && "message" in error
              ? String((error as { message?: string }).message)
              : "We couldn’t build your estimate. Try again.";
          setEstimateError(userFriendlyEstimateError(msg));
          return;
        }
        if (data && typeof data === "object" && "summary" in data) {
          const result = data as PhotoToScopeResult;
          setEstimate(result);
          try {
            sessionStorage.setItem(
              "bluprnt_pending_estimate",
              JSON.stringify(result),
            );
          } catch {
            /* ignore */
          }
        } else {
          setEstimateError(userFriendlyEstimateError("unknown"));
        }
      } catch {
        setEstimateError(userFriendlyEstimateError("network"));
      } finally {
        setEstimateLoading(false);
      }
    },
    [params],
  );

  const fetchOnboardingContext = useCallback(async () => {
    try {
      const { data, error } = await invokeFunction<{
        status_messages: string[];
        market_bulletin: string;
        value_tips: string[];
      }>("get-onboarding-context", {
        body: {
          projectType: params.projectType,
          zipCode: params.zipFromLocation(),
        },
      });

      if (!error && data) {
        setOnboardingContext(data);
      }
    } catch (err) {
      console.warn("[OnboardingEstimation] Failed to fetch context:", err);
    }
  }, [params]);

  return {
    estimate,
    setEstimate,
    estimateError,
    setEstimateError,
    estimateLoading,
    onboardingContext,
    runPhotoToScope,
    fetchOnboardingContext,
  };
}
