import { ScopeDetail } from "@/components/dashboard/ScopeDetail";
import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import { GroundingSourcesSection } from "@/components/dashboard/GroundingSourcesSection";
import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryWithLines,
} from "@shared/types/database";
import type { ReconciliationResult } from "@shared/lib/reconciliation";

interface DashboardScopeProps {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryWithLines[];
  reconciliation: ReconciliationResult | null;
  onRefresh: () => Promise<void>;
  isArchitect: boolean;
  hasProjectPass: boolean;
  homeTeam: React.ReactNode;
}

export function DashboardScope({
  project,
  scopeItems,
  ledgerEntries,
  reconciliation,
  onRefresh,
  isArchitect,
  hasProjectPass,
  homeTeam,
}: DashboardScopeProps) {
  return (
    <DashboardSubPage
      side={
        <div className="space-y-8">
          <GroundingSourcesSection project={project} />
          {homeTeam}
        </div>
      }
    >
      <ScopeDetail
        key={project.id}
        project={project}
        scopeItems={scopeItems}
        ledgerEntries={ledgerEntries}
        reconciliation={reconciliation}
        projectId={project.id}
        onRefresh={onRefresh}
        isArchitect={isArchitect}
        hasProjectPass={hasProjectPass}
      />
    </DashboardSubPage>
  );
}
