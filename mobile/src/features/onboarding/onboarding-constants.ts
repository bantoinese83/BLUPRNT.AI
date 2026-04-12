import type { ProjectTypeOption } from "../../lib/onboarding-helpers";

/** Seven internal steps; progress UI is grouped into three phases. */
export const ONBOARDING_LAST_STEP_INDEX = 6;

export const ONBOARDING_PHASES = [
  { label: "About project" },
  { label: "Your estimate" },
  { label: "Save" },
] as const;

export function phaseIndexForStep(step: number): number {
  if (step <= 3) return 0;
  if (step <= 5) return 1;
  return 2;
}

export function hasValidOnboardingZip(locationInput: string): boolean {
  return /^\d{5}$/.test(locationInput.trim());
}

export function onboardingZipCode(locationInput: string): string {
  const digits = locationInput.replace(/\D/g, "").slice(0, 5);
  return hasValidOnboardingZip(locationInput) ? locationInput.trim() : digits;
}

/** Matches web `LoadingScreen` status copy (rotating lines under the loader). */
export function loadingScreenMessages(
  projectType: ProjectTypeOption | null,
  locationInput: string,
): string[] {
  const kind =
    projectType === "Kitchen"
      ? "kitchen"
      : projectType === "Bathroom"
        ? "bathroom"
        : "project";
  const zipLabel = hasValidOnboardingZip(locationInput)
    ? locationInput.trim()
    : "";
  return [
    `Building your ${kind} estimate...`,
    zipLabel
      ? `Pulling typical costs near ${zipLabel}...`
      : "Checking what remodels cost near you...",
    `Matching materials people actually use on ${kind} jobs...`,
    "Layering in labor for your area...",
    "Almost there—tidying the numbers...",
  ];
}
