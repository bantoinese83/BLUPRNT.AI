import type { Session } from "@supabase/supabase-js";
import type { ProjectTypeOption, StageOption } from "@/lib/onboarding-helpers";
import type { OnboardingEstimateState } from "@/features/onboarding/hooks/useOnboardingAnalysis";
import { onboardingStyles } from "@/features/onboarding/onboarding-screen.styles";

export type OnboardingStyles = typeof onboardingStyles;

export type OnboardingStepContentProps = {
  step: number;
  onboardingStyles: OnboardingStyles;
  projectType: ProjectTypeOption | null;
  setProjectType: (v: ProjectTypeOption | null) => void;
  location: string;
  setLocation: (v: string) => void;
  locatingZip: boolean;
  onFillZipFromLocation: () => void;
  stage: StageOption | null;
  setStage: (v: StageOption | null) => void;
  photos: string[];
  setPhotos: (v: string[] | ((prev: string[]) => string[])) => void;
  scopeDescription: string;
  setScopeDescription: (v: string) => void;
  analysisAwaitingChoice: boolean;
  onAnalysisRetry: () => void;
  onAnalysisTextOnly: () => void;
  onAnalysisRegionalFallback: () => void;
  analysisBarTargetW: number;
  onAnalysisBarLayout: (width: number) => void;
  analysisIndex: number;
  analysisMessages: string[];
  estimate: OnboardingEstimateState;
  showBreakdown: boolean;
  setShowBreakdown: (v: boolean) => void;
  session: Session | null;
  onComplete: () => void;
};
