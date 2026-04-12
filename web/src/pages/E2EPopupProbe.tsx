import { useEffect } from "react";

/**
 * Playwright-only route (VITE_E2E=1). Detects when `window.open` is blocked (returns null).
 */
export default function E2EPopupProbe() {
  useEffect(() => {
    const win = window.open(
      "https://example.com/",
      "_blank",
      "noopener,noreferrer",
    );
    document.documentElement.dataset.e2ePopupOpen = win ? "opened" : "blocked";
  }, []);

  return (
    <div className="p-6 text-slate-600" data-testid="e2e-popup-probe-root">
      E2E popup probe
    </div>
  );
}
