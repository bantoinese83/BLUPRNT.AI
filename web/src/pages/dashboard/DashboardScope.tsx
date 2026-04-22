import { ScopeDetail } from "@/components/dashboard/ScopeDetail";
import type { ProjectRow, ScopeRow } from "@shared/types/database";

interface DashboardScopeProps {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  onRefresh: () => Promise<void>;
  isArchitect: boolean;
  hasProjectPass: boolean;
}

export function DashboardScope({
  project,
  scopeItems,
  onRefresh,
  isArchitect,
  hasProjectPass,
}: DashboardScopeProps) {
  return (
    <ScopeDetail
      key={project.id}
      project={project}
      scopeItems={scopeItems}
      projectId={project.id}
      onRefresh={onRefresh}
      isArchitect={isArchitect}
      hasProjectPass={hasProjectPass}
    />
  );
}
