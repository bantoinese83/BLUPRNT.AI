import { ScopeDetail } from "@/components/dashboard/ScopeDetail";
import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import { GroundingSourcesSection } from "@/components/dashboard/GroundingSourcesSection";
import type { ProjectRow, ScopeRow } from "@shared/types/database";

interface DashboardScopeProps {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  onRefresh: () => Promise<void>;
  isArchitect: boolean;
  hasProjectPass: boolean;
  health: React.ReactNode;
  homeTeam: React.ReactNode;
  transformation: React.ReactNode;
  ledger: React.ReactNode;
}

export function DashboardScope({
  project,
  scopeItems,
  onRefresh,
  isArchitect,
  hasProjectPass,
  health,
  homeTeam,
  transformation,
  ledger,
}: DashboardScopeProps) {
  return (
    <DashboardSubPage
      side={
        <div className="space-y-8">
          {transformation}
          {health}
          <GroundingSourcesSection project={project} />
          {homeTeam}
          {ledger}
        </div>
      }
    >
      <ScopeDetail
        key={project.id}
        project={project}
        scopeItems={scopeItems}
        projectId={project.id}
        onRefresh={onRefresh}
        isArchitect={isArchitect}
        hasProjectPass={hasProjectPass}
      />
    </DashboardSubPage>
  );
}
