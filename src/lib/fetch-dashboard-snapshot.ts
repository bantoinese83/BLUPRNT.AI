import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
  ProjectPassRow,
} from "@/types/database";

export type DashboardSnapshot = {
  configured: boolean;
  /** When set, the hook redirects to login with this `returnTo` path. */
  redirectToLogin: string | null;
  loadError: string | null;
  projects: ProjectRow[];
  project: ProjectRow | null;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  /** Resolved active project id after preferences + defaults. */
  lastProjectId: string | null;
};

const emptySnapshot = (): DashboardSnapshot => ({
  configured: true,
  redirectToLogin: null,
  loadError: null,
  projects: [],
  project: null,
  scopeItems: [],
  invoices: [],
  isArchitect: false,
  subscription: null,
  hasProjectPass: false,
  lastProjectId: null,
});

/**
 * Loads dashboard data from Supabase (+ session cache). Pure except for
 * sessionStorage / localStorage writes that mirror existing client behavior.
 */
export async function fetchDashboardSnapshot(options?: {
  currentPath?: string;
}): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) {
    return { ...emptySnapshot(), configured: false };
  }

  const path =
    options?.currentPath ??
    `${typeof window !== "undefined" ? window.location.pathname : "/dashboard"}${typeof window !== "undefined" ? window.location.search : ""}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      ...emptySnapshot(),
      redirectToLogin: getSafeRedirect(path, "/dashboard"),
    };
  }

  const cacheKey = `bluprnt_dash_${session.user.id}`;
  const cachedRaw =
    typeof window !== "undefined" ? sessionStorage.getItem(cacheKey) : null;

  let hadCache = false;
  if (cachedRaw) {
    try {
      const c = JSON.parse(cachedRaw) as Record<string, unknown>;
      if (c && typeof c === "object" && Array.isArray(c.projects)) {
        hadCache = true;
      }
    } catch {
      /* ignore */
    }
  }

  if (!hadCache && typeof window !== "undefined") {
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));
    await minDelay;
  }

  let projectId: string | null = null;
  try {
    if (typeof window !== "undefined") {
      projectId = localStorage.getItem("bluprnt_project_id");
    }
  } catch {
    /* ignore */
  }

  const prefRes = await supabase
    .from("user_preferences")
    .select("last_active_project_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!prefRes.error && prefRes.data?.last_active_project_id) {
    projectId = prefRes.data.last_active_project_id;
  }

  const projRes = await supabase
    .from("projects")
    .select(
      "id, name, property_id, estimated_min_total, estimated_max_total, confidence_score, stage, created_at, properties!inner(owner_user_id)",
    )
    .eq("properties.owner_user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (projRes.error) {
    return {
      ...emptySnapshot(),
      loadError: friendlyDashboardLoadError(projRes.error),
    };
  }

  const rows = (projRes.data ?? []) as unknown as ProjectRow[];

  if (rows.length > 0) {
    if (!projectId) {
      projectId = rows[0].id;
      try {
        if (typeof window !== "undefined" && projectId) {
          localStorage.setItem("bluprnt_project_id", projectId);
        }
      } catch {
        /* ignore */
      }
    }

    let project: ProjectRow | null =
      rows.find((p) => p.id === projectId) ?? null;
    if (!project) {
      projectId = rows[0].id;
      project = rows[0];
      try {
        if (typeof window !== "undefined" && projectId) {
          localStorage.setItem("bluprnt_project_id", projectId);
        }
      } catch {
        /* ignore */
      }
    }

    if (!projectId) {
      return {
        ...emptySnapshot(),
        projects: rows,
        project: null,
        lastProjectId: null,
      };
    }

    const [scopesRes, invRes, subRes, subRes2] = await Promise.all([
      supabase
        .from("scope_items")
        .select(
          "id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score, source, metadata",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
      supabase
        .from("invoices")
        .select(
          "id, vendor_name, total, created_at, payment_status, document_type, document_id",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      supabase
        .from("project_passes")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle(),
    ]);

    const detailErr =
      scopesRes.error || invRes.error || subRes.error || subRes2.error;
    const loadErrorPartial = detailErr
      ? "Some details couldn’t load. Your summary may be incomplete — try refreshing."
      : null;

    const newScopes = (scopesRes.data ?? []) as ScopeRow[];
    const newInvoices = (invRes.data ?? []) as InvoiceRow[];
    const sub = subRes.data as UserSubscriptionRow | null;
    const pass = subRes2.data as ProjectPassRow | null;
    const newIsArchitect = sub?.status === "active";
    const newHasProjectPass = !!pass;

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          projects: rows,
          project: rows.find((p) => p.id === projectId) ?? rows[0] ?? null,
          scopeItems: newScopes,
          invoices: newInvoices,
          isArchitect: newIsArchitect,
          subscription: sub,
          hasProjectPass: newHasProjectPass,
        }),
      );
    }

    return {
      configured: true,
      redirectToLogin: null,
      loadError: loadErrorPartial,
      projects: rows,
      project,
      scopeItems: newScopes,
      invoices: newInvoices,
      isArchitect: newIsArchitect,
      subscription: sub,
      hasProjectPass: newHasProjectPass,
      lastProjectId: projectId,
    };
  }

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(cacheKey);
  }

  return {
    ...emptySnapshot(),
    projects: rows,
    project: null,
    lastProjectId: null,
  };
}

export const dashboardQueryKey = ["dashboard", "snapshot"] as const;
