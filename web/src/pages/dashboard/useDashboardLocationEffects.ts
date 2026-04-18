import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { CONFETTI_PALETTES } from "@shared/constants/visualization";

/**
 * Stripe return + deep-link query params on the dashboard.
 */
export function useDashboardUpgradeQueryEffect(
  search: string,
  pathname: string,
  hash: string,
  navigate: NavigateFunction,
  setShowUpgrade: Dispatch<SetStateAction<boolean>>,
): void {
  useEffect(() => {
    const params = new URLSearchParams(search);
    const upgrade = params.get("upgrade");
    if (upgrade !== "architect" && upgrade !== "pass") return;
    params.delete("upgrade");
    const qs = params.toString();
    navigate(`${pathname}${qs ? `?${qs}` : ""}${hash}`, { replace: true });
    const id = window.setTimeout(() => setShowUpgrade(true), 0);
    return () => window.clearTimeout(id);
  }, [search, pathname, hash, navigate, setShowUpgrade]);
}

export function useDashboardCheckoutSuccessConfetti(search: string): void {
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("success") === "true") {
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", newUrl);

      toast.success("Welcome to Architect!", {
        description:
          "Your professional features and higher limits are now active.",
        duration: 8000,
      });

      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.6 },
        colors: [...CONFETTI_PALETTES.brandMuted],
      });
    }
  }, [search]);
}
