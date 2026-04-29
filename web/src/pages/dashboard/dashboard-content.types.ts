import type {
  LedgerEntryWithLines,
  ProjectRow,
  ScopeRow,
  UserSubscriptionRow,
} from "@shared/types/database";

import type { ReconciliationResult } from "@shared/lib/reconciliation";
import type { Contractor } from "@shared/lib/home-team";
import type { ResaleImpactResult } from "@shared/lib/resale-value";

export interface DashboardContentProps {
  projects: ProjectRow[];
  project: ProjectRow;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryWithLines[];
  spendByCategory: Record<string, number>;
  reconciliation: ReconciliationResult | null;
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  homeTeam: Contractor[];
  investmentTotal: number;
  resaleImpact: ResaleImpactResult;
  load: () => Promise<void>;
  loadError: string | null;
  refreshing: boolean;
  clearLoadError: () => void;
  handleProjectSelect: (id: string) => void;
  setProjects: (projects: ProjectRow[]) => void;
  setProject: (project: ProjectRow | null) => void;
  setScopeItems: (items: ScopeRow[]) => void;
  setLedgerEntries: (entries: LedgerEntryWithLines[]) => void;
}
