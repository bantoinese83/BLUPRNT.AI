import { getSafeRedirect } from "@/lib/safe-redirect";

const PROTECTED_PATHS = ["/dashboard", "/settings"];

export function isProtectedAppPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** Login URL when session ends on a protected route; null if no redirect needed. */
export function loginPathAfterSignOut(
  pathname: string,
  search = "",
): string | null {
  if (!isProtectedAppPath(pathname)) return null;
  const path = `${pathname}${search || ""}`;
  const redirect = getSafeRedirect(path, "/dashboard");
  return `/login?redirect=${encodeURIComponent(redirect)}`;
}
