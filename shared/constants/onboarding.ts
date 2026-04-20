import type { ProjectTypeOption } from "../lib/onboarding-helpers";

/** Moment B: short trust line while users share ZIP and project details (web + mobile). */
export const ONBOARDING_PRIVACY_NOTE =
  "We use your answers to build your estimate and ledger. We don’t sell your contact info to contractors.";

export const ONBOARDING_PHASE_LABELS = [
  "About project",
  "Your estimate",
  "Save",
] as const;

/** Progress phases (mobile + web copy); order matches `ONBOARDING_WEB_PHASES`. */
export const ONBOARDING_PHASES = ONBOARDING_PHASE_LABELS.map((label) => ({
  label,
}));

/** Last zero-based step index in the seven-step onboarding flow (mobile). */
export const ONBOARDING_LAST_STEP_INDEX = 6;

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

/** Rotating status lines during scope → estimate analysis (web loading screen + mobile). */
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

/** Web onboarding breadcrumb / stepper (pathname → label). */
export const ONBOARDING_WEB_STEPS = [
  { path: "/onboarding/type", label: "Project" },
  { path: "/onboarding/location", label: "Location" },
  { path: "/onboarding/stage", label: "Stage" },
  { path: "/onboarding/photo", label: "Photos" },
  { path: "/onboarding/text-scope", label: "Details" },
  { path: "/onboarding/loading", label: "Analysis" },
  { path: "/onboarding/estimate", label: "Estimate" },
  { path: "/onboarding/signup", label: "Account" },
] as const;

/** Web phases: labels shared with mobile; `paths` are React Router locations. */
export const ONBOARDING_WEB_PHASES = [
  {
    label: ONBOARDING_PHASE_LABELS[0],
    paths: [
      "/onboarding/type",
      "/onboarding/location",
      "/onboarding/stage",
      "/onboarding/photo",
      "/onboarding/text-scope",
    ],
  },
  {
    label: ONBOARDING_PHASE_LABELS[1],
    paths: ["/onboarding/loading", "/onboarding/estimate"],
  },
  { label: ONBOARDING_PHASE_LABELS[2], paths: ["/onboarding/signup"] },
] as const;

export function phaseIndexForOnboardingPath(pathname: string): number {
  for (let i = ONBOARDING_WEB_PHASES.length - 1; i >= 0; i--) {
    for (const p of ONBOARDING_WEB_PHASES[i].paths) {
      if (p === pathname) return i;
    }
  }
  return 0;
}

/** Edge `photo-to-scope` when Gemini did not return a payload. */
export const FALLBACK_REASON_AI_UNAVAILABLE =
  "ai_analysis_unavailable" as const;
/** Client-only range from project type (no API scope). */
export const FALLBACK_REASON_CLIENT_TYPE_BENCHMARK =
  "client_type_benchmark" as const;

export type EstimateFallbackReason =
  | typeof FALLBACK_REASON_AI_UNAVAILABLE
  | typeof FALLBACK_REASON_CLIENT_TYPE_BENCHMARK;

/**
 * One plain sentence when the dollar range is not a full AI line-item estimate.
 */
export function estimateFallbackUserMessage(
  usedFallback: boolean | undefined,
  reason: string | null | undefined,
): string | null {
  if (!usedFallback) return null;
  if (reason === FALLBACK_REASON_CLIENT_TYPE_BENCHMARK) {
    return "This is a broad benchmark for your project type—not a line-by-line estimate.";
  }
  return "We couldn't finish the full analysis right now. This range is a regional placeholder—compare with local quotes.";
}
