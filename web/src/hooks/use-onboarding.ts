import { useContext } from "react";
import { OnboardingContext } from "@/contexts/onboarding-context";

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
