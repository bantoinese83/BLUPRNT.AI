/**
 * Shared Supabase queries and aggregation for dashboard snapshots (web + mobile).
 * Platform code owns auth redirects, localStorage / AsyncStorage, and cache policies.
 */
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
  ProjectPassRow,
  GalleryItemRow,
} from "../types/database";
import type { DashboardSnapshot } from "../types/dashboard-snapshot";
import { buildSpendByCategory } from "./spend-by-category";
import { partialDashboardLoadMessage } from "./dashboard-partial-load";
import { isArchitectPlanEffective } from "./architect-entitlement";
import {
  buildReconciliation,
  type ReconciliationResult,
} from "./reconciliation";

export function emptyDashboardSnapshot(): DashboardSnapshot {
  return {
    configured: true,
    redirectToLogin: null,
    loadError: null,
    projects: [],
    project: null,
    scopeItems: [],
    invoices: [],
    spendByCategory: {},
    reconciliation: null,
    isArchitect: false,
    subscription: null,
    hasProjectPass: false,
    galleryItems: [],
    lastProjectId: null,
  };
}

const PROJECTS_LIST_SELECT =
  "id, name, property_id, estimated_min_total, estimated_max_total, confidence_score, stage, created_at, properties!inner(owner_user_id), before_photo_storage_path, after_photo_storage_path, grounding_sources";

const SCOPE_SELECT =
  "id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score, source, metadata, justification, maintenance_tips, priority, phase";

const INVOICE_SELECT =
  "id, vendor_name, total, created_at, payment_status, document_type, document_id, issue_date, project_id, vendor_contact_info, warranty_expiry_date";

const INVOICE_WITH_LINES_SELECT = `${INVOICE_SELECT}, invoice_line_items(invoice_id, category, line_total, scope_item_id)`;

const GALLERY_SELECT =
  "id, project_id, photo_type, storage_path, caption, uploaded_by_user_id, created_at";

/**
 * All projects the user owns (via property → owner).
 */
export async function fetchDashboardProjectsList(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ rows: ProjectRow[]; error: PostgrestError | null }> {
  const projRes = await supabase
    .from("projects")
    .select(PROJECTS_LIST_SELECT)
    .eq("properties.owner_user_id", userId)
    .order("created_at", { ascending: false });
  if (projRes.error) {
    return { rows: [], error: projRes.error };
  }
  return {
    rows: (projRes.data ?? []) as unknown as ProjectRow[],
    error: null,
  };
}

export async function fetchLastActiveProjectIdFromPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const prefRes = await supabase
    .from("user_preferences")
    .select("last_active_project_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!prefRes.error && prefRes.data?.last_active_project_id) {
    return prefRes.data.last_active_project_id;
  }
  return null;
}

export type BuiltDashboardForProject = {
  project: ProjectRow;
  scopeItems: import("../types/database").ScopeRow[];
  invoices: import("../types/database").InvoiceRow[];
  galleryItems: import("../types/database").GalleryItemRow[];
  spendByCategory: Record<string, number>;
  reconciliation: ReconciliationResult | null;
  loadError: string | null;
  isArchitect: boolean;
  subscription: import("../types/database").UserSubscriptionRow | null;
  hasProjectPass: boolean;
  lastProjectId: string;
};

/**
 * Loads scope, invoices, subscription, pass, and spend-by-category for a project.
 * Callers must only pass a `projectId` that exists in `allProjects` (when non-empty).
 */
export async function buildDashboardDataForProject(
  supabase: SupabaseClient,
  input: {
    userId: string;
    projectId: string;
    allProjects: ProjectRow[];
    partialMessageVariant: "web" | "mobile";
  },
): Promise<BuiltDashboardForProject> {
  const { userId, projectId, allProjects, partialMessageVariant } = input;

  const [scopesRes, invRes, subRes, subRes2, galleryRes] = await Promise.all([
    supabase
      .from("scope_items")
      .select(SCOPE_SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("invoices")
      .select(INVOICE_WITH_LINES_SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("project_passes")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("project_gallery")
      .select(GALLERY_SELECT)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  const loadError = partialDashboardLoadMessage(
    {
      scopeFailed: !!scopesRes.error,
      invoicesFailed: !!invRes.error,
      subscriptionFailed: !!subRes.error,
      projectPassFailed: !!subRes2.error,
      galleryFailed: !!galleryRes.error,
    },
    { variant: partialMessageVariant },
  );

  const newScopes = (scopesRes.data ?? []) as ScopeRow[];
  const newInvoicesRaw = (invRes.data ?? []) as (InvoiceRow & {
    invoice_line_items?: import("../types/database").InvoiceLineItemRow[];
  })[];
  const newInvoices = newInvoicesRaw as InvoiceRow[];
  const newGalleryItems = (galleryRes.data ?? []) as GalleryItemRow[];
  const sub = subRes.data as UserSubscriptionRow | null;
  const pass = subRes2.data as ProjectPassRow | null;
  const isArchitect = isArchitectPlanEffective(sub);
  const hasProjectPass = !!pass;

  const allLineItems = newInvoicesRaw.flatMap(
    (inv) => inv.invoice_line_items || [],
  );
  const spendByCategory = buildSpendByCategory(allLineItems, newScopes);
  const reconciliation = buildReconciliation(newScopes, allLineItems);

  const project =
    allProjects.find((p) => p.id === projectId) ??
    (allProjects[0] as ProjectRow);

  return {
    project,
    scopeItems: newScopes,
    invoices: newInvoices,
    galleryItems: newGalleryItems,
    spendByCategory,
    reconciliation,
    loadError,
    isArchitect,
    subscription: sub,
    hasProjectPass,
    lastProjectId: projectId,
  };
}
