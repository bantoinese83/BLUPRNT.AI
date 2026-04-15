import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
} from "./database";

/** Dashboard bundle used by web and mobile data layers. */
export type DashboardSnapshot = {
  configured: boolean;
  /** Web: when set, client redirects to login with this `returnTo` path. */
  redirectToLogin: string | null;
  loadError: string | null;
  projects: ProjectRow[];
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  spendByCategory: Record<string, number>;
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  lastProjectId: string | null;
};
