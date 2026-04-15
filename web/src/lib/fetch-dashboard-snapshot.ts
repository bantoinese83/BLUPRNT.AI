import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { friendlyDashboardLoadError } from "@/lib/dashboard-load-error";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
  ProjectPassRow,
} from "@shared/types/database";
import { buildSpendByCategory } from "@shared/lib/spend-by-category";
import { partialDashboardLoadMessage } from "@shared/lib/dashboard-partial-load";
import type { DashboardSnapshot } from "@shared/types/dashboard-snapshot";
import { parseCachedDashboardPayload } from "@shared/lib/dashboard-cache-payload";

export type { DashboardSnapshot };

const emptySnapshot = (): DashboardSnapshot => ({
  configured: true,
  redirectToLogin: null,
  loadError: null,
  projects: [],
  project: null,
  scopeItems: [],
  invoices: [],
  spendByCategory: {},
  isArchitect: false,
  subscription: null,
  hasProjectPass: false,
  lastProjectId: null,
});

function snapshotFromCachePayload(
  c: NonNullable<ReturnType<typeof parseCachedDashboardPayload>>,
): DashboardSnapshot {
  let lastProjectId: string | null = c.project?.id ?? null;
  if (!lastProjectId && typeof window !== "undefined") {
    try {
      lastProjectId = localStorage.getItem("bluprnt_project_id");
    } catch {
      /* ignore */
    }
  }
  return {
    configured: true,
    redirectToLogin: null,
    loadError: null,
    projects: c.projects,
    project: c.project,
    scopeItems: c.scopeItems,
    invoices: c.invoices,
    spendByCategory: c.spendByCategory,
    isArchitect: c.isArchitect,
    subscription: c.subscription,
    hasProjectPass: c.hasProjectPass,
    lastProjectId,
  };
}

async function loadStaleDashboardFromSession(
  cacheKey: string,
): Promise<DashboardSnapshot | null> {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(cacheKey);
  if (!raw) return null;
  const c = parseCachedDashboardPayload(raw);
  if (!c) return null;
  return snapshotFromCachePayload(c);
}

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
    const stale = await loadStaleDashboardFromSession(cacheKey);
    if (stale) {
      return {
        ...stale,
        loadError: friendlyDashboardLoadError(projRes.error),
      };
    }
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

    const loadErrorPartial = partialDashboardLoadMessage(
      {
        scopeFailed: !!scopesRes.error,
        invoicesFailed: !!invRes.error,
        subscriptionFailed: !!subRes.error,
        projectPassFailed: !!subRes2.error,
      },
      { variant: "web" },
    );

    const newScopes = (scopesRes.data ?? []) as ScopeRow[];
    const newInvoices = (invRes.data ?? []) as InvoiceRow[];
    const sub = subRes.data as UserSubscriptionRow | null;
    const pass = subRes2.data as ProjectPassRow | null;
    const newIsArchitect = sub?.status === "active";
    const newHasProjectPass = !!pass;

    const invoiceIds = newInvoices.map((i) => i.id).filter(Boolean);
    let spendByCategory: Record<string, number> = {};
    if (invoiceIds.length > 0) {
      const linesRes = await supabase
        .from("invoice_line_items")
        .select("category, line_total, scope_item_id")
        .in("invoice_id", invoiceIds);
      if (!linesRes.error) {
        spendByCategory = buildSpendByCategory(linesRes.data ?? [], newScopes);
      }
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          projects: rows,
          project: rows.find((p) => p.id === projectId) ?? rows[0] ?? null,
          scopeItems: newScopes,
          invoices: newInvoices,
          spendByCategory,
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
      spendByCategory,
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
