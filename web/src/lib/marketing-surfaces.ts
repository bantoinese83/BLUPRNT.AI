/**
 * Routes where the floating help widget stays hidden (same UX as before).
 */
export function isHelpWidgetHiddenPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    return true;
  }
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/onboarding")) return true;
  return false;
}

/**
 * Home landing only: skip loading command palette + help widget chunks so the
 * first paint ships less JavaScript (Lighthouse / mobile performance).
 */
export function isHeavyGlobalChromeDeferredPath(pathname: string): boolean {
  return pathname === "/";
}
