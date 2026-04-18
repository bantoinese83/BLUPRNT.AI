import type {
  InvoiceRow,
  ProjectRow,
  ScopeRow,
  UserSubscriptionRow,
} from "@shared/types/database";

export interface DashboardContentProps {
  projects: ProjectRow[];
  project: ProjectRow;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  load: () => Promise<void>;
  loadError: string | null;
  refreshing: boolean;
  clearLoadError: () => void;
  handleProjectSelect: (id: string) => void;
  setProjects: (projects: ProjectRow[]) => void;
  setProject: (project: ProjectRow | null) => void;
  setScopeItems: (items: ScopeRow[]) => void;
  setInvoices: (invoices: InvoiceRow[]) => void;
}
