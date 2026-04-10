import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
} from "../../../shared/types/database";

/** Shared dashboard cache shape for the mobile data layer (mirrors web). */
export type DashboardSnapshot = {
  configured: boolean;
  redirectToLogin: string | null;
  loadError: string | null;
  projects: ProjectRow[];
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  lastProjectId: string | null;
};
