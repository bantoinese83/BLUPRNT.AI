import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
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

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Ensure the skeleton is visible for at least 1.2s
    const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));

    const [
      {
        data: { session },
      },
    ] = await Promise.all([supabase.auth.getSession(), minDelay]);

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
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const c = JSON.parse(cachedData);
        if (c.projects) setProjects(c.projects);
        if (c.project) setProject(c.project);
        if (c.scopeItems) setScopeItems(c.scopeItems);
        if (c.invoices) setInvoices(c.invoices);
        if (c.isArchitect !== undefined) setIsArchitect(c.isArchitect);
        if (c.subscription !== undefined) setSubscription(c.subscription);
        if (c.hasProjectPass !== undefined) setHasProjectPass(c.hasProjectPass);
        setLoading(false);
      } catch {
        // ignore cache decode errors
      }
    }

    let projectId: string | null = null;
    try {
      projectId = localStorage.getItem("bluprnt_project_id");
    } catch {
      /* ignore */
    }

    const { data: allProjects } = await supabase
      .from("projects")
      .select(
        "id, name, property_id, estimated_min_total, estimated_max_total, confidence_score, stage, properties!inner(owner_user_id)",
      )
      .eq("properties.owner_user_id", session.user.id)
      .order("created_at", { ascending: false });

    const rows = (allProjects ?? []) as ProjectRow[];
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
            "id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score",
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

    if (projectId === lastFetchedProjectId.current) {
      setLoading(false);
      return;
    }
    lastFetchedProjectId.current = projectId;
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
    (id: string) => {
      try {
        localStorage.setItem("bluprnt_project_id", id);
      } catch {
        /* ignore */
      }
      load();
    },
    [load],
  );

  return {
    loading,
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
