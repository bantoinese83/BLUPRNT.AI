import { useLocation, useNavigate } from "react-router-dom";
import { ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstimateSummary } from "@/components/dashboard/EstimateSummary";
import { PlanVsActualCard } from "@/components/dashboard/PlanVsActualCard";
import { ActivityFeed, type ActivityEvent } from "@/components/dashboard/ActivityFeed";
import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import type { ProjectRow, ScopeRow, InvoiceRow } from "@shared/types/database";

interface DashboardPlanProps {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  activityEvents: ActivityEvent[];
  isArchitect: boolean;
  hasProjectPass: boolean;
  health: React.ReactNode;
  ledger: React.ReactNode;
  invoicesComp: React.ReactNode;
  onUpgradeClick: () => void;
}

export function DashboardPlan({
  project,
  scopeItems,
  invoices,
  activityEvents,
  isArchitect,
  hasProjectPass,
  health,
  ledger,
  invoicesComp,
  onUpgradeClick,
}: DashboardPlanProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <DashboardSubPage
      side={
        <>
          {health}
          {location.pathname.endsWith("/plan") && (
            <ActivityFeed events={activityEvents} className="mt-8" />
          )}
          {ledger}
        </>
      }
    >
      <EstimateSummary
        project={project}
        scopeItems={scopeItems}
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
        View full scope
      </Button>
      <ComponentErrorBoundary name="Invoices Ledger">
        {invoicesComp}
      </ComponentErrorBoundary>
    </DashboardSubPage>
  );
}
