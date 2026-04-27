import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryRow,
  UserSubscriptionRow,
} from "./database";

import type { ReconciliationResult } from "../lib/reconciliation";

/** Dashboard bundle used by web and mobile data layers. */
export type DashboardSnapshot = {
  configured: boolean;
  /** Web: when set, client redirects to login with this `returnTo` path. */
  redirectToLogin: string | null;
  loadError: string | null;
  projects: ProjectRow[];
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryRow[];
  spendByCategory: Record<string, number>;
  reconciliation: ReconciliationResult | null;
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  galleryItems: import("./database").GalleryItemRow[];
  lastProjectId: string | null;
};
