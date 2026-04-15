import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import { PlanVsActualCard } from "@/components/dashboard/PlanVsActualCard";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import type { ProjectRow, InvoiceRow } from "@shared/types/database";

interface DashboardExecuteProps {
  project: ProjectRow;
  invoices: InvoiceRow[];
  health: React.ReactNode;
  invoicesComp: React.ReactNode;
}

export function DashboardExecute({
  project,
  invoices,
  health,
  invoicesComp,
}: DashboardExecuteProps) {
  return (
    <DashboardSubPage side={health}>
      <PlanVsActualCard
        estimatedMin={project.estimated_min_total}
        estimatedMax={project.estimated_max_total}
        invoices={invoices}
      />
      <ComponentErrorBoundary name="Invoices Ledger">
        {invoicesComp}
      </ComponentErrorBoundary>
    </DashboardSubPage>
  );
}
