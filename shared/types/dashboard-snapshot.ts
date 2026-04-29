import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryWithLines,
  UserSubscriptionRow,
  GalleryItemRow,
} from "./database.ts";

import type { ReconciliationResult } from "../lib/reconciliation.ts";

/** Dashboard bundle used by web and mobile data layers. */
export type DashboardSnapshot = {
  configured: boolean;
  /** Web: when set, client redirects to login with this `returnTo` path. */
  redirectToLogin: string | null;
  loadError: string | null;
  projects: ProjectRow[];
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryWithLines[];
  spendByCategory: Record<string, number>;
  reconciliation: ReconciliationResult | null;
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  galleryItems: GalleryItemRow[];
  lastProjectId: string | null;
};
