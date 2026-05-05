import { useEffect } from "react";
import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";
import type { PhotoToScopeResult } from "@/types/estimate";
import type { ProjectTypeOption, StageOption } from "@/types/onboarding";

export function useOnboardingSync(params: {
  setProjectType: (v: ProjectTypeOption | null) => void;
  setLocationInput: (v: string) => void;
  setStage: (v: StageOption | null) => void;
  setScopeDescription: (v: string) => void;
  setEstimate: (v: PhotoToScopeResult | null) => void;
}) {
  useEffect(() => {
    const paramsUrl = new URLSearchParams(window.location.search);
    const syncToken = paramsUrl.get("sync");
    if (!syncToken) return;

    // Clean URL
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", newUrl);

    const loadSync = async () => {
      const dismiss = toast.loading("Resuming your mobile draft...");
      try {
        const { data: payloadJson, error } = await invokeFunction<
          Record<string, unknown>
        >("get-onboarding-sync-payload", {
          body: { token: syncToken },
        });

        if (error || payloadJson == null) {
          throw new Error("Link expired or invalid");
        }

        const payload = payloadJson;
        if (payload.projectType)
          params.setProjectType(payload.projectType as ProjectTypeOption);
        if (payload.location)
          params.setLocationInput(payload.location as string);
        if (payload.stage) params.setStage(payload.stage as StageOption);
        if (payload.scopeDescription)
          params.setScopeDescription(payload.scopeDescription as string);
        if (payload.estimate) {
          params.setEstimate(payload.estimate as PhotoToScopeResult);
          sessionStorage.setItem(
            "bluprnt_pending_estimate",
            JSON.stringify(payload.estimate),
          );
        }

        toast.success("Ready to finish your BLUPRNT!", {
          id: dismiss,
        });
      } catch (_err) {
        toast.error("Couldn't resume draft. Please start again.", {
          id: dismiss,
        });
      }
    };

    void loadSync();
  }, [params]);
}
