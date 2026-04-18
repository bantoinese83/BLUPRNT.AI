import React from "react";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import OnboardingScreenFeature from "@/features/onboarding/OnboardingScreen";

export default function OnboardingScreen() {
  return (
    <ComponentErrorBoundary name="Onboarding">
      <OnboardingScreenFeature />
    </ComponentErrorBoundary>
  );
}
