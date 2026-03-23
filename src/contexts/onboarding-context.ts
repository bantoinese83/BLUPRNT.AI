import { createContext } from "react";
import type { OnboardingContextValue } from "@/types/onboarding";

export const OnboardingContext = createContext<OnboardingContextValue | null>(
  null,
);
