import { useEffect, useRef } from "react";
import type { NavigateFunction } from "react-router-dom";
import type { DashboardSnapshot } from "@shared/types/dashboard-snapshot";

/**
 * Unauthenticated web dashboard: redirect to login with return path (parity with previous inline effect).
 */
export function useWebDashboardAuthRedirect(
  snapshot: DashboardSnapshot | undefined,
  configured: boolean | undefined,
  navigate: NavigateFunction,
) {
  const lastRedirect = useRef<string | null>(null);

  useEffect(() => {
    if (!snapshot?.redirectToLogin || !configured) {
      lastRedirect.current = null;
      return;
    }
    const target = `/login?redirect=${encodeURIComponent(snapshot.redirectToLogin)}`;
    if (lastRedirect.current === target) return;
    lastRedirect.current = target;
    navigate(target, { replace: true });
  }, [snapshot?.redirectToLogin, configured, navigate]);
}
