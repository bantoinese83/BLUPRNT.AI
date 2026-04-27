import { useEffect } from "react";
import type { LedgerEntryRow, ProjectRow } from "@shared/types/database";
import { CONFETTI_PALETTES } from "@shared/constants/visualization";
import { runViewportCelebration } from "@/lib/dashboard-celebration-confetti";

const spendKey = (projectId: string) => `bluprnt_celebrate_spend_${projectId}`;
const firstInvKey = (projectId: string) =>
  `bluprnt_celebrate_firstinv_${projectId}`;

/**
 * One-time-per-tab “celebration” for spend milestone and first invoice upload.
 * Uses sessionStorage so navigating between dashboard routes does not replay confetti.
 */
export function useDashboardMilestoneConfetti(
  project: ProjectRow,
  ledgerEntries: LedgerEntryRow[],
): void {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pid = project.id;
    const min = project.estimated_min_total ?? 0;

    if (ledgerEntries.length > 0 && !sessionStorage.getItem(spendKey(pid))) {
      const total = ledgerEntries.reduce(
        (s: number, i: LedgerEntryRow) => s + (i.total ?? 0),
        0,
      );
      if (total >= min) {
        sessionStorage.setItem(spendKey(pid), "1");
        runViewportCelebration(CONFETTI_PALETTES.brandMuted);
        return;
      }
    }

    if (
      ledgerEntries.length === 1 &&
      !sessionStorage.getItem(firstInvKey(pid))
    ) {
      sessionStorage.setItem(firstInvKey(pid), "1");
      runViewportCelebration(CONFETTI_PALETTES.firstDocument);
    }
  }, [project.id, project.estimated_min_total, ledgerEntries]);
}
