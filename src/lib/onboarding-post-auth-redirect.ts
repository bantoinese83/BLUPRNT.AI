import { getSafeRedirect } from "@/lib/safe-redirect";

const PENDING_ESTIMATE_KEY = "bluprnt_pending_estimate";

/**
 * If onboarding produced an estimate stored in session storage (same tab),
 * send the user back to the save step after external login/register.
 * Mirrors mobile `getPostAuthRedirectHref` for the web storage model.
 */
export function getOnboardingResumeIfPending(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_ESTIMATE_KEY);
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "summary" in parsed &&
      typeof (parsed as { summary?: unknown }).summary === "object" &&
      (parsed as { summary: unknown }).summary !== null
    ) {
      return "/onboarding/signup";
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Prefer an explicit `?redirect=` when present and safe; otherwise resume
 * in-progress onboarding (pending estimate) or default to dashboard.
 */
export function resolvePostLoginHref(
  redirectParam: string | null | undefined,
): string {
  const trimmed = redirectParam?.trim();
  if (trimmed) {
    return getSafeRedirect(trimmed, "/dashboard");
  }
  return getOnboardingResumeIfPending() ?? "/dashboard";
}
