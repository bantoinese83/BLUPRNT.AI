import { useLocation, useNavigate } from "react-router-dom";
import { ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstimateSummary } from "@/components/dashboard/EstimateSummary";
import { PlanVsActualCard } from "@/components/dashboard/PlanVsActualCard";
import {
  ActivityFeed,
  type ActivityEvent,
} from "@/components/dashboard/ActivityFeed";
import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import { GroundingSourcesSection } from "@/components/dashboard/GroundingSourcesSection";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import type { ProjectRow, ScopeRow, InvoiceRow } from "@shared/types/database";
import type { ReconciliationResult } from "@shared/lib/reconciliation";

interface DashboardPlanProps {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  activityEvents: ActivityEvent[];
  reconciliation: ReconciliationResult | null;
  isArchitect: boolean;
  hasProjectPass: boolean;
  health: React.ReactNode;
  homeTeam: React.ReactNode;
  transformationVault: React.ReactNode;
  homeSpecsVault: React.ReactNode;
  ledger: React.ReactNode;
  documentsComp: React.ReactNode;
  onUpgradeClick: () => void;
}

export function DashboardPlan({
  project,
  scopeItems,
  invoices,
  activityEvents,
  reconciliation,
  isArchitect,
  hasProjectPass,
  health,
  homeTeam,
  transformationVault,
  homeSpecsVault,
  ledger,
  documentsComp,
  onUpgradeClick,
}: DashboardPlanProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <DashboardSubPage
      side={
        <div className="space-y-8">
          {transformationVault}
          {homeSpecsVault}
          {health}
          <GroundingSourcesSection project={project} />
          {homeTeam}
          {location.pathname.endsWith("/plan") && (
            <ActivityFeed events={activityEvents} />
          )}
          {ledger}
        </div>
      }
    >
      <EstimateSummary
        project={project}
        scopeItems={scopeItems}
        reconciliation={reconciliation}
        isArchitect={isArchitect}
        hasProjectPass={hasProjectPass}
        onUpgradeClick={onUpgradeClick}
      />
      <PlanVsActualCard
        estimatedMin={project.estimated_min_total}
        estimatedMax={project.estimated_max_total}
        invoices={invoices}
      />
      <Button
        variant="outline"
        className="w-full gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
        onClick={() => navigate("/dashboard/scope")}
        type="button"
      >
        <ListTree className="w-5 h-5 shrink-0" aria-hidden />
        View full budget
      </Button>
      <ComponentErrorBoundary name="Documents Ledger">
        {documentsComp}
      </ComponentErrorBoundary>
    </DashboardSubPage>
  );
}
