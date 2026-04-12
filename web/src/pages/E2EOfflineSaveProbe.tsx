import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Playwright-only route (VITE_E2E=1). Simulates “save” via fetch; fails when browser is offline.
 */
export default function E2EOfflineSaveProbe() {
  const [status, setStatus] = useState<"idle" | "ok" | "offline">("idle");

  async function runSave() {
    setStatus("idle");
    try {
      const r = await fetch(`${window.location.origin}/login`, {
        method: "GET",
        cache: "no-store",
      });
      setStatus(r.ok ? "ok" : "offline");
    } catch {
      setStatus("offline");
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-lg font-bold text-slate-900">Offline save probe</h1>
      <p className="text-sm text-slate-600">
        Uses a simple GET to the login page as a stand-in for a save request.
      </p>
      <Button
        type="button"
        data-testid="e2e-offline-save-trigger"
        onClick={() => void runSave()}
      >
        Save
      </Button>
      <p
        data-testid="e2e-offline-save-status"
        className="text-sm font-medium text-slate-800"
      >
        {status}
      </p>
    </div>
  );
}
