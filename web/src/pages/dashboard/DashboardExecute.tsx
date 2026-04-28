import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import { PlanVsActualCard } from "@/components/dashboard/PlanVsActualCard";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import type { ProjectRow, LedgerEntryRow } from "@shared/types/database";

interface DashboardExecuteProps {
  project: ProjectRow;
  ledgerEntries: LedgerEntryRow[];
  health: React.ReactNode;
  documentsComp: React.ReactNode;
}

export function DashboardExecute({
  project,
  ledgerEntries,
  health,
  documentsComp,
}: DashboardExecuteProps) {
  return (
    <DashboardSubPage side={health}>
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
