import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { InvoiceRow, ProjectRow } from "@shared/types/database";
import { CONFETTI_PALETTES } from "@shared/constants/visualization";

/**
 * Lightweight “celebration” moments tied to invoice totals and first upload.
 */
export function useDashboardMilestoneConfetti(
  project: ProjectRow,
  invoices: InvoiceRow[],
  hasCelebrated: boolean,
  setHasCelebrated: (v: boolean) => void,
  hasCelebratedFirst: boolean,
  setHasCelebratedFirst: (v: boolean) => void,
): void {
  useEffect(() => {
    if (invoices.length > 0 && !hasCelebrated) {
      const total = invoices.reduce(
        (s: number, i: InvoiceRow) => s + (i.total ?? 0),
        0,
      );
      if (total >= (project.estimated_min_total ?? 0)) {
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          colors: [...CONFETTI_PALETTES.brandMuted],
        });
        setTimeout(() => setHasCelebrated(true), 100);
      }
    }
    if (invoices.length === 1 && !hasCelebratedFirst) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [...CONFETTI_PALETTES.firstDocument],
      });
      setTimeout(() => setHasCelebratedFirst(true), 100);
    }
  }, [
    project,
    invoices,
    hasCelebrated,
    hasCelebratedFirst,
    setHasCelebrated,
    setHasCelebratedFirst,
  ]);
}
