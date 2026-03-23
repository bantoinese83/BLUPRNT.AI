import { useState, useEffect, useLayoutEffect, useCallback, useRef, type ReactNode } from "react";

import { Helmet } from "react-helmet-async";

import { useNavigate, Routes, Route, Navigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";
import { ResaleValueImpact } from "@/components/dashboard/ResaleValueImpact";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectHeader } from "@/components/dashboard/ProjectHeader";
import { ProjectSwitcher } from "@/components/dashboard/ProjectSwitcher";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { EstimateSummary } from "@/components/dashboard/EstimateSummary";
import { ScopeDetail } from "@/components/dashboard/ScopeDetail";
import { InvoicesSection } from "@/components/dashboard/InvoicesSection";
import { ProjectHealth } from "@/components/dashboard/ProjectHealth";
import { PropertyLedger } from "@/components/dashboard/PropertyLedger";
import { UpgradeModal, type UpgradeOpenReason } from "@/components/dashboard/UpgradeModal";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { DashboardWelcomeBanner } from "@/components/dashboard/DashboardWelcomeBanner";
import { DashboardTabIntro } from "@/components/dashboard/DashboardTabIntro";
import {
  FolderOpen,
  Settings2,
  LogOut,
  Rocket,
  ListTree,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import type { ProjectRow, ScopeRow, InvoiceRow } from "@/types/database";

function DashboardSubPage({
  children,
  side,
}: {
  children: ReactNode;
  side: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <DashboardTabs />
      <DashboardTabIntro />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        <div className="lg:col-span-2 space-y-8">{children}</div>
        <div className="space-y-6">{side}</div>
      </div>
    </div>
  );
}

/** Collapse /dashboard/plan/plan/... (relative Navigate bug) to /dashboard/plan */
function normalizeRepeatedPlanPath(pathname: string): string | null {
  if (!/^\/dashboard(\/plan)+$/.test(pathname)) return null;
  if (pathname === "/dashboard/plan") return null;
  return "/dashboard/plan";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [useDiscount, setUseDiscount] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<UpgradeOpenReason>("general");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [project, setProject] = useState<ProjectRow|null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [isArchitect, setIsArchitect] = useState(false);
  const lastFetchedProjectId = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const returnTo = getSafeRedirect(
        `${window.location.pathname}${window.location.search}`,
        "/dashboard",
      );
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }
    let projectId: string | null = null;
    try {
      projectId = localStorage.getItem("bluprnt_project_id");
    } catch {
      /* ignore */
    }
    const { data: props } = await supabase
      .from("properties")
      .select("id")
      .eq("owner_user_id", session.user.id);
    const propIds = (props ?? []).map((p) => p.id);

    if (propIds.length) {
      const { data: allProjects } = await supabase
        .from("projects")
        .select("id, name, property_id, estimated_min_total, estimated_max_total, confidence_score")
        .in("property_id", propIds)
        .order("created_at", { ascending: false });
      const rows = (allProjects ?? []) as ProjectRow[];
      setProjects(rows);

      if (!projectId && rows.length) {
        projectId = rows[0].id;
        try {
          localStorage.setItem("bluprnt_project_id", projectId);
        } catch {
          /* ignore */
        }
      }
      if (projectId) {
        const proj = rows.find((p) => p.id === projectId) ?? null;
        if (proj) {
          setProject(proj);
        } else {
          const { data: single } = await supabase
            .from("projects")
            .select("id, name, property_id, estimated_min_total, estimated_max_total, confidence_score")
            .eq("id", projectId)
            .single();
          const resolved = (single ?? null) as ProjectRow | null;
          setProject(resolved);
          if (!resolved && rows.length) {
            projectId = rows[0].id;
            setProject(rows[0]);
            try {
              localStorage.setItem("bluprnt_project_id", projectId);
            } catch {
              /* ignore */
            }
          }
        }
      } else {
        setProject(rows[0] ?? null);
        projectId = rows[0]?.id ?? null;
      }
    }

    if (projectId) {
      const { data: scopes } = await supabase
        .from("scope_items")
        .select("id, category, description, finish_tier, quantity, unit, unit_cost_min, unit_cost_max, total_cost_min, total_cost_max, confidence_score")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      setScopeItems((scopes ?? []) as ScopeRow[]);

      const { data: inv } = await supabase
        .from("invoices")
        .select("id, vendor_name, total, created_at, payment_status, document_type")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      setInvoices((inv ?? []) as InvoiceRow[]);

      // Check subscription status
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      setIsArchitect(sub?.status === "active");
    }

    if (projectId === lastFetchedProjectId.current && project !== null) {
      setLoading(false);
      return;
    }
    lastFetchedProjectId.current = projectId;

    setLoading(false);
  }, [navigate, project]);



  useLayoutEffect(() => {
    const fixed = normalizeRepeatedPlanPath(location.pathname);
    if (fixed) {
      navigate(`${fixed}${location.search}${location.hash}`, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    let active = true;
    const executeLoad = async () => {
      // Avoid synchronous setState on mount by waiting for next tick
      await Promise.resolve();
      if (active) load();
    };
    executeLoad();
    return () => {
      active = false;
    };
  }, [load]);

  useEffect(() => {
    if (project && invoices.length > 0 && !hasCelebrated) {
      const total = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
      if (total >= (project.estimated_min_total ?? 0)) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#020617", "#475569", "#94a3b8", "#e2e8f0"]

        });
        setTimeout(() => setHasCelebrated(true), 100);
      }
    }
  }, [project, invoices, hasCelebrated]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/onboarding");
  }

  function handleProjectSelect(id: string) {
    try {
      localStorage.setItem("bluprnt_project_id", id);
    } catch {
      /* ignore */
    }
    load();
  }

  async function handleProjectDelete(id: string) {
    if (!isSupabaseConfigured()) return;
    
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("Error deleting project:", error);
      alert("Couldn't delete project. It may have associated data that needs to be removed first.");
      return;
    }
    
    if (id === project?.id) {
      localStorage.removeItem("bluprnt_project_id");
    }
    
    load();
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-4 max-w-md mx-auto">
        <div className="rounded-2xl bg-amber-100 p-4 text-amber-800">
          <Settings2 className="w-10 h-10 mx-auto" aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">BLUPRNT isn&apos;t connected yet</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          This copy of the app needs your project keys to load. Ask whoever set up the app, or check the README in the project folder for step-by-step setup.
        </p>
        <p className="text-xs text-slate-500">
          Developers: add <code className="bg-slate-200 px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
          <code className="bg-slate-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-slate-200 px-1 rounded">.env</code>.
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-sm mx-auto">
        <div className="rounded-2xl bg-slate-200/80 p-5 text-slate-600">
          <FolderOpen className="w-12 h-12 mx-auto" strokeWidth={1.25} aria-hidden />
        </div>
        <p className="text-slate-700 font-medium">No saved project yet.</p>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate("/onboarding")}
        >
          <Rocket className="w-5 h-5 shrink-0" aria-hidden />
          Start an estimate
        </Button>
        <button
          type="button"
          className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-2"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" aria-hidden />
          Sign out
        </button>
      </div>
    );
  }

  const invoiceTotal = invoices.reduce((s, i) => s + (i.total ?? 0), 0);

  const stats = (
    <DashboardStats
      estimatedMin={project.estimated_min_total}
      estimatedMax={project.estimated_max_total}
      invoiceTotal={invoiceTotal}
      invoiceCount={invoices.length}
    />
  );

  const health = (
    <ProjectHealth
      estimatedMin={project.estimated_min_total}
      estimatedMax={project.estimated_max_total}
      invoiceTotal={invoiceTotal}
    />
  );

  const ledger = (
    <div className="space-y-6">
      <ResaleValueImpact investment={invoiceTotal} projectName={project.name} />
      <PropertyLedger
        projectId={project.id}
        propertyId={project.property_id}
        project={{
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
        }}
        scopeItems={scopeItems}
        invoices={invoices}
        onUpgradeClick={() => {
          setUpgradeReason("general");
          setShowUpgrade(true);
        }}
      />
    </div>
  );

  const invoicesComp = (
    <InvoicesSection
      projectId={project.id}
      invoices={invoices}
      onUploaded={load}
      onUpgradeClick={(reason) => {
        setUpgradeReason(reason === "invoice_limit" ? "invoice_limit" : "general");
        setShowUpgrade(true);
      }}
    />
  );

  return (
    <div className="min-h-screen dashboard-bg">
      <Helmet>
        <title>{project?.name ? `${project.name} — BLUPRNT.AI` : "Dashboard — BLUPRNT.AI"}</title>
      </Helmet>

      <DashboardHeader 
        onSignOut={handleSignOut} 
        projectName={project.name} 
        isArchitect={isArchitect} 
        onUpgradeClick={() => {
          setUpgradeReason("general");
          setShowUpgrade(true);
        }}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <ProjectSwitcher
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            currentId={project?.id ?? null}
            onSelect={handleProjectSelect}
            onDelete={handleProjectDelete}
          />
        </div>
        <ProjectHeader project={project} />

        <DashboardWelcomeBanner />
        {stats}

        <UpgradeBanner
          invoiceCount={invoices.filter((i) => (i.document_type ?? "invoice") === "invoice").length}
          onUpgradeClick={() => {
            setUpgradeReason("invoice_limit");
            setShowUpgrade(true);
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route
                path=""
                element={<Navigate to="/dashboard/plan" replace />}
              />
              <Route
                path="plan"
                element={
                  <DashboardSubPage
                    side={
                      <>
                        {health}
                        {ledger}
                      </>
                    }
                  >
                    <EstimateSummary project={project} scopeItems={scopeItems} />
                    <Button
                      variant="outline"
                      className="w-full gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
                      onClick={() => navigate("/dashboard/scope")}
                      type="button"
                    >
                      <ListTree className="w-5 h-5 shrink-0" aria-hidden />
                      View full scope
                    </Button>
                    {invoicesComp}
                  </DashboardSubPage>
                }
              />
              <Route
                path="scope"
                element={
                  <ScopeDetail
                    project={project}
                    scopeItems={scopeItems}
                    projectId={project.id}
                    onRefresh={load}
                  />
                }
              />
              <Route
                path="execute"
                element={
                  <DashboardSubPage side={health}>
                    {invoicesComp}
                  </DashboardSubPage>
                }
              />
              <Route
                path="record"
                element={
                  <DashboardSubPage side={health}>
                    {ledger}
                  </DashboardSubPage>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          setUseDiscount(false);
          setUpgradeReason("general");
        }}
        showDiscount={useDiscount}
        openReason={upgradeReason}
        estimatedAmount={
          project.estimated_min_total != null && project.estimated_max_total != null
            ? (project.estimated_min_total + project.estimated_max_total) / 2
            : project.estimated_min_total ?? project.estimated_max_total
        }
        projectId={project.id}
      />

      <LeadCaptureModal 
        onPlanSelect={(_plan) => {
          setUseDiscount(true);
          setUpgradeReason("general");
          setShowUpgrade(true);
        }}
      />
    </div>
  );
}
