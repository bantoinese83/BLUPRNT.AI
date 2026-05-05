import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import { PlanVsActualCard } from "@/components/dashboard/PlanVsActualCard";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import type { ProjectRow, LedgerEntryRow } from "@shared/types/database";

interface DashboardExecuteProps {
  project: ProjectRow;
  ledgerEntries: LedgerEntryRow[];
  documentsComp: React.ReactNode;
}

/**
 * Tracker tab: main column is plan vs spend + documents. Health Index stays on
 * Plan / Vault sidebars only — avoids duplicating the same story as PlanVsActualCard.
 */
export function DashboardExecute({
  project,
  ledgerEntries,
  documentsComp,
}: DashboardExecuteProps) {
  return (
    <DashboardSubPage>
      <PlanVsActualCard
        estimatedMin={project.estimated_min_total}
        estimatedMax={project.estimated_max_total}
        ledgerEntries={ledgerEntries as LedgerEntryRow[]}
      />
      <ComponentErrorBoundary name="Documents Ledger">
        {documentsComp}
      </ComponentErrorBoundary>
    </DashboardSubPage>
  );
}
