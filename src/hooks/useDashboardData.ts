import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export function useDashboardData() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [isArchitect, setIsArchitect] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscriptionRow | null>(
    null,
  );
  const [hasProjectPass, setHasProjectPass] = useState(false);
  const lastFetchedProjectId = useRef<string | null>(null);

  const clearLoadError = useCallback(() => setLoadError(null), []);

  const load = useCallback(async () => {
    setLoadError(null);

    if (!isSupabaseConfigured()) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const returnTo = getSafeRedirect(
        `${window.location.pathname}${window.location.search}`,
        "/dashboard",
      );
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, {
        replace: true,
      });
      return;
    }

    const cacheKey = `bluprnt_dash_${session.user.id}`;
    const cachedRaw = sessionStorage.getItem(cacheKey);
    let hadCache = false;
    if (cachedRaw) {
      try {
        const c = JSON.parse(cachedRaw) as Record<string, unknown>;
        if (c && typeof c === "object" && Array.isArray(c.projects)) {
          hadCache = true;
          setProjects(c.projects as ProjectRow[]);
          if (c.project) setProject(c.project as ProjectRow);
          if (c.scopeItems) setScopeItems(c.scopeItems as ScopeRow[]);
          if (c.invoices) setInvoices(c.invoices as InvoiceRow[]);
          if (c.isArchitect !== undefined)
            setIsArchitect(Boolean(c.isArchitect));
          if (c.subscription !== undefined)
            setSubscription(c.subscription as UserSubscriptionRow | null);
          if (c.hasProjectPass !== undefined)
            setHasProjectPass(Boolean(c.hasProjectPass));
          setLoading(false);
          setRefreshing(true);
        }
      } catch {
        /* ignore */
      }
    }

    if (!hadCache) {
      setLoading(true);
      setRefreshing(false);
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));
      await minDelay;
    }

    let projectId: string | null = null;
    try {
      projectId = localStorage.getItem("bluprnt_project_id");
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
      setLoadError(friendlyDashboardLoadError(projRes.error));
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const rows = (projRes.data ?? []) as ProjectRow[];
    setProjects(rows);

    if (rows.length > 0) {
      if (!projectId) {
        projectId = rows[0].id;
        try {
          localStorage.setItem("bluprnt_project_id", projectId);
        } catch {
          /* ignore */
        }
      }

      const proj = rows.find((p) => p.id === projectId) ?? null;
      if (proj) {
        setProject(proj);
      } else {
        projectId = rows[0].id;
        setProject(rows[0]);
        try {
          localStorage.setItem("bluprnt_project_id", projectId);
        } catch {
          /* ignore */
        }
      }
    } else {
      setProject(null);
      projectId = null;
    }

    if (projectId) {
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
            "id, vendor_name, total, created_at, payment_status, document_type",
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
      if (detailErr) {
        setLoadError(
          "Some details couldn’t load. Your summary may be incomplete — try refreshing.",
        );
      }

      const newScopes = (scopesRes.data ?? []) as ScopeRow[];
      const newInvoices = (invRes.data ?? []) as InvoiceRow[];
      const sub = subRes.data as UserSubscriptionRow | null;
      const pass = subRes2.data as ProjectPassRow | null;

      const newIsArchitect = sub?.status === "active";
      const newHasProjectPass = !!pass;

      setScopeItems(newScopes);
      setInvoices(newInvoices);
      setIsArchitect(newIsArchitect);
      setSubscription(sub);
      setHasProjectPass(newHasProjectPass);

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
    } else {
      sessionStorage.removeItem(cacheKey);
    }

    lastFetchedProjectId.current = projectId;
    setRefreshing(false);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const executeLoad = async () => {
      await Promise.resolve();
      if (active) load();
    };
    executeLoad();
    return () => {
      active = false;
    };
  }, [load]);

  const handleProjectSelect = useCallback(
    async (id: string) => {
      try {
        localStorage.setItem("bluprnt_project_id", id);
      } catch {
        /* ignore */
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("user_preferences").upsert({
          user_id: session.user.id,
          last_active_project_id: id,
          updated_at: new Date().toISOString(),
        });
      }
      load();
    },
    [load],
  );

  return {
    loading,
    refreshing,
    loadError,
    clearLoadError,
    projects,
    project,
    scopeItems,
    invoices,
    isArchitect,
    subscription,
    hasProjectPass,
    load,
    handleProjectSelect,
    setProjects,
    setProject,
    setScopeItems,
    setInvoices,
  };
}
