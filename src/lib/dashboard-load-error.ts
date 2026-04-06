/** Plain-language copy for failed dashboard data loads (no technical jargon). */
export function friendlyDashboardLoadError(
  err: {
    message?: string;
    code?: string;
  } | null,
): string {
  if (!err?.message && !err?.code) {
    return "We couldn’t load your data. Try again in a moment.";
  }
  const m = (err.message || "").toLowerCase();
  const c = err.code || "";
  if (m.includes("network") || m.includes("failed to fetch")) {
    return "Check your internet connection and try again.";
  }
  if (
    c === "PGRST301" ||
    m.includes("jwt") ||
    m.includes("permission denied") ||
    m.includes("not authorized")
  ) {
    return "Your session may have expired. Sign out and sign in again.";
  }
  return "We couldn’t load your data. Try again in a moment.";
}
