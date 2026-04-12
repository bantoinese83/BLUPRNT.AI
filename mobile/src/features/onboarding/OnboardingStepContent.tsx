import React from "react";
import { View, Text } from "react-native";
import type { OnboardingStepContentProps } from "@/features/onboarding/onboarding-step-types";
import { ProjectTypeSelector } from "@/features/onboarding/components/ProjectTypeSelector";
import { LocationSelector } from "@/features/onboarding/components/LocationSelector";
import { StageSelector } from "@/features/onboarding/components/StageSelector";
import { VisionCapture } from "@/features/onboarding/components/VisionCapture";
import { AnalysisStep } from "@/features/onboarding/components/AnalysisStep";
import { EstimatePreview } from "@/features/onboarding/components/EstimatePreview";
import { FinalStep } from "@/features/onboarding/components/FinalStep";

export function OnboardingStepContent(props: OnboardingStepContentProps) {
  const styles = props.onboardingStyles;
  const {
    step,
    projectType,
    setProjectType,
    location,
    setLocation,
    locatingZip,
    onFillZipFromLocation,
    stage,
    setStage,
    photos,
    setPhotos,
    scopeDescription,
    setScopeDescription,
    analysisAwaitingChoice,
    onAnalysisRetry,
    onAnalysisTextOnly,
    onAnalysisRegionalFallback,
    analysisBarTargetW,
    onAnalysisBarLayout,
    analysisIndex,
    analysisMessages,
    estimate,
    showBreakdown,
    setShowBreakdown,
    session,
    onComplete,
  } = props;

  switch (step) {
    case 0:
      return (
        <ProjectTypeSelector
          styles={styles}
          projectType={projectType}
          setProjectType={setProjectType}
        />
      );
    case 1:
      return (
        <LocationSelector
          styles={styles}
          location={location}
          setLocation={setLocation}
          locatingZip={locatingZip}
          onFillZipFromLocation={onFillZipFromLocation}
        />
      );
    case 2:
      return (
        <StageSelector styles={styles} stage={stage} setStage={setStage} />
      );
    case 3:
      return (
        <VisionCapture
          styles={styles}
          photos={photos}
          setPhotos={setPhotos}
          scopeDescription={scopeDescription}
          setScopeDescription={setScopeDescription}
        />
      );
    case 4:
      return (
        <AnalysisStep
          styles={styles}
          analysisAwaitingChoice={analysisAwaitingChoice}
          onAnalysisRetry={onAnalysisRetry}
          onAnalysisTextOnly={onAnalysisTextOnly}
          onAnalysisRegionalFallback={onAnalysisRegionalFallback}
          analysisBarTargetW={analysisBarTargetW}
          onAnalysisBarLayout={onAnalysisBarLayout}
          analysisIndex={analysisIndex}
          analysisMessages={analysisMessages}
        />
      );
    case 5:
      return (
        <EstimatePreview
          styles={styles}
          projectType={projectType}
          location={location}
          estimate={estimate}
          showBreakdown={showBreakdown}
          setShowBreakdown={setShowBreakdown}
        />
      );
    case 6:
      return (
        <FinalStep
          styles={styles}
          session={session}
          onComplete={onComplete}
          projectType={projectType}
          location={location}
          stage={stage}
          photos={photos}
          scopeDescription={scopeDescription}
          estimate={estimate}
        />
      );
    default:
      return (
        <View style={styles.centerContainer}>
          <Text style={{ color: "white" }}>Initializing...</Text>
        </View>
      );
  }
}
