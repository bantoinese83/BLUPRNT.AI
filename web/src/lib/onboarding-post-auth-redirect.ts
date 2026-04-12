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

/**
 * Reads and clears `bluprnt_auth_redirect` from sessionStorage, then applies
 * safe redirect + onboarding resume (same rules as after OAuth).
 */
export function consumeAuthCallbackRedirectHref(): string {
  if (typeof window === "undefined") {
    return "/dashboard";
  }
  let redirectTo = "/dashboard";
  let usedStoredRedirect = false;
  try {
    const stored = sessionStorage.getItem("bluprnt_auth_redirect");
    if (stored) {
      sessionStorage.removeItem("bluprnt_auth_redirect");
      redirectTo = getSafeRedirect(stored);
      usedStoredRedirect = true;
    }
  } catch {
    /* ignore */
  }
  if (!usedStoredRedirect) {
    const resume = getOnboardingResumeIfPending();
    if (resume) {
      redirectTo = resume;
    }
  }
  return redirectTo;
}
