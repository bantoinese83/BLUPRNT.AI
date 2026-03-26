import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { EmptyState } from "@/components/EmptyState";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Helmet } from "react-helmet-async";

import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import confetti from "canvas-confetti";
import { ResaleValueImpact } from "@/components/dashboard/ResaleValueImpact";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectHeader } from "@/components/dashboard/ProjectHeader";
import { ProjectSwitcher } from "@/components/dashboard/ProjectSwitcher";
import { generateDashboardSummaryPDF } from "@/lib/pdf-export";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { EstimateSummary } from "@/components/dashboard/EstimateSummary";
import { generateActivityEvents } from "@/lib/activity";
import { ScopeDetail } from "@/components/dashboard/ScopeDetail";
import { InvoicesSection } from "@/components/dashboard/InvoicesSection";
import { ProjectHealth } from "@/components/dashboard/ProjectHealth";
import { PropertyLedger } from "@/components/dashboard/PropertyLedger";
import {
  UpgradeModal,
  type UpgradeOpenReason,
} from "@/components/dashboard/UpgradeModal";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { DashboardWelcomeBanner } from "@/components/dashboard/DashboardWelcomeBanner";
import { NextStepsChecklist } from "@/components/dashboard/NextStepsChecklist";
import { DashboardTabIntro } from "@/components/dashboard/DashboardTabIntro";
import { Settings2, LogOut, ListTree } from "lucide-react";
import { toast } from "sonner";

import { motion, AnimatePresence } from "motion/react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSafeRedirect } from "@/lib/safe-redirect";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
  ProjectPassRow,
} from "@/types/database";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
    },
  },
} as const;

function DashboardSubPage({
  children,
  side,
}: {
  children: ReactNode;
  side: ReactNode;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <DashboardTabs />
      </motion.div>
      <motion.div variants={itemVariants}>
        <DashboardTabIntro />
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          {children}
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 content-start"
        >
          {side}
        </motion.div>
      </div>
    </motion.div>
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
  const [upgradeReason, setUpgradeReason] =
    useState<UpgradeOpenReason>("general");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [isArchitect, setIsArchitect] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscriptionRow | null>(
    null,
  );
  const [hasProjectPass, setHasProjectPass] = useState(false);
  const lastFetchedProjectId = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const upgrade = params.get("upgrade");
    if (upgrade !== "architect" && upgrade !== "pass") return;
    params.delete("upgrade");
    const qs = params.toString();
    navigate(`${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`, {
      replace: true,
    });
    const id = window.setTimeout(() => setShowUpgrade(true), 0);
    return () => window.clearTimeout(id);
  }, [location.search, location.pathname, location.hash, navigate]);

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
        setLoading(false); // Render instantly (stale-while-revalidate)
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
    // 1. Fetch all projects securely by joining properties
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
        // Fallback if cached ID is invalid for this user
        projectId = rows[0].id;
        setProject(rows[0]);
        try {
          localStorage.setItem("bluprnt_project_id", projectId);
        } catch {
          /* ignore */
        }
      }
    } else {
      // No projects
      setProject(null);
      projectId = null;
    }

    if (projectId) {
      // 2. Fetch all required sub-data for the selected project in parallel
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
      // Clear cache if no projects
      sessionStorage.removeItem(cacheKey);
    }

    if (projectId === lastFetchedProjectId.current) {
      setLoading(false);
      return;
    }
    lastFetchedProjectId.current = projectId;

    setLoading(false);
  }, [navigate]);

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
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "true") {
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", newUrl);

      toast.success("Welcome to Architect!", {
        description:
          "Your professional features and higher limits are now active.",
        duration: 8000,
      });

      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#020617", "#94a3b8"],
      });
    }
  }, [location.search]);

  useEffect(() => {
    if (project && invoices.length > 0 && !hasCelebrated) {
      const total = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
      if (total >= (project.estimated_min_total ?? 0)) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#020617", "#475569", "#94a3b8", "#e2e8f0"],
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

  const invoiceTotal = invoices.reduce((s, i) => s + (i.total ?? 0), 0);

  const handleExportPDF = useCallback(async () => {
    if (!project) return;
    await generateDashboardSummaryPDF(project, invoices, invoiceTotal);
    toast.success("Project summary exported to PDF");
  }, [project, invoices, invoiceTotal]);

  async function handleProjectDelete(id: string) {
    if (!isSupabaseConfigured()) return;

    // Store current state for rollback
    const originalProjects = [...projects];
    const originalCurrentProject = project;

    // Optimistically update UI
    setProjects(projects.filter((p) => p.id !== id));
    if (id === project?.id) {
      setProject(null);
      setScopeItems([]);
      setInvoices([]);
    }

    const deleteAction = async () => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;

      if (id === localStorage.getItem("bluprnt_project_id")) {
        localStorage.removeItem("bluprnt_project_id");
      }
      return true;
    };

    toast.promise(deleteAction(), {
      loading: "Deleting project...",
      success: () => {
        // If we deleted the current project, we need to load or redirect
        if (id === originalCurrentProject?.id) {
          load();
        }
        return "Project permanently removed";
      },
      error: () => {
        // Rollback on error
        setProjects(originalProjects);
        setProject(originalCurrentProject);
        return "Failed to delete project";
      },
    });
  }

  if (loading) {
    return (
      <>
        <DashboardSkeleton />
        <AppSlimFooter className="border-slate-200/70 bg-white/50" />
      </>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-2xl bg-amber-100 p-4 text-amber-800">
            <Settings2 className="mx-auto h-10 w-10" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            BLUPRNT isn&apos;t connected yet
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            This copy of the app needs your project keys to load. Ask whoever
            set up the app, or check the README in the project folder for
            step-by-step setup.
          </p>
          <p className="text-xs text-slate-500">
            Developers: add{" "}
            <code className="rounded bg-slate-200 px-1">VITE_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="rounded bg-slate-200 px-1">
              VITE_SUPABASE_ANON_KEY
            </code>{" "}
            in <code className="rounded bg-slate-200 px-1">.env</code>.
          </p>
        </div>
        <AppSlimFooter className="bg-white/60" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <EmptyState
            variant="projects"
            title="No projects tracked yet"
            description="Create your first project to start tracking benchmarks and managing your budget like a pro."
            action={{
              label: "Create Your First Project",
              onClick: () => navigate("/onboarding"),
            }}
            className="w-full max-w-md"
          />
          <button
            type="button"
            className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-900"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out account
          </button>
        </div>
        <AppSlimFooter className="bg-white/60" />
      </div>
    );
  }

  // Generate dynamic activity events
  const activityEvents = generateActivityEvents(project, invoices);

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
        setUpgradeReason(
          reason === "invoice_limit" ? "invoice_limit" : "general",
        );
        setShowUpgrade(true);
      }}
      isArchitect={isArchitect}
      subscription={subscription}
      hasProjectPass={hasProjectPass}
    />
  );

  return (
    <div className="min-h-screen dashboard-bg page-fade-in">
      <Helmet>
        <title>
          {project?.name
            ? `${project.name} — BLUPRNT.AI`
            : "Dashboard — BLUPRNT.AI"}
        </title>
      </Helmet>

      <DashboardHeader
        onSignOut={handleSignOut}
        projectName={project.name}
        isArchitect={isArchitect}
        hasProjectPass={hasProjectPass}
        onUpgradeClick={() => {
          setUpgradeReason("general");
          setShowUpgrade(true);
        }}
        onExportPDF={handleExportPDF}
      />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <ProjectSwitcher
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            currentId={project?.id ?? null}
            onSelect={handleProjectSelect}
            onDelete={handleProjectDelete}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ProjectHeader project={project} />
        </motion.div>

        <motion.div variants={itemVariants}>
          <DashboardWelcomeBanner />
        </motion.div>

        {project && (
          <motion.div variants={itemVariants}>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Your Guided Path
              </h3>
              <NextStepsChecklist
                stage={project.stage || "planning"}
                onAction={(id) => {
                  if (id === "review-scope") navigate("/dashboard/scope");
                  if (id === "upload-quote") {
                    const scrollTarget = document.getElementById(
                      "invoice-upload-anchor",
                    );
                    if (scrollTarget)
                      scrollTarget.scrollIntoView({ behavior: "smooth" });
                  }
                  if (id === "export-packet") handleExportPDF();
                  if (id === "upload-invoice") {
                    const scrollTarget = document.getElementById(
                      "invoice-upload-anchor",
                    );
                    if (scrollTarget)
                      scrollTarget.scrollIntoView({ behavior: "smooth" });
                  }
                  if (id === "review-health") {
                    const scrollTarget = document.getElementById(
                      "property-ledger-anchor",
                    );
                    if (scrollTarget)
                      scrollTarget.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>{stats}</motion.div>

        <motion.div variants={itemVariants}>
          <UpgradeBanner
            invoiceCount={
              invoices.filter(
                (i) => (i.document_type ?? "invoice") === "invoice",
              ).length
            }
            onUpgradeClick={() => {
              setUpgradeReason("invoice_limit");
              setShowUpgrade(true);
            }}
            isArchitect={isArchitect}
            hasProjectPass={hasProjectPass}
          />
        </motion.div>

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
                        {location.pathname.endsWith("/plan") && (
                          <ActivityFeed
                            events={activityEvents}
                            className="mt-8"
                          />
                        )}
                        {ledger}
                      </>
                    }
                  >
                    <EstimateSummary
                      project={project}
                      scopeItems={scopeItems}
                      isArchitect={isArchitect}
                      hasProjectPass={hasProjectPass}
                      onUpgradeClick={() => {
                        setUpgradeReason("general");
                        setShowUpgrade(true);
                      }}
                    />
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
                    isArchitect={isArchitect}
                    hasProjectPass={hasProjectPass}
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
                  <DashboardSubPage side={health}>{ledger}</DashboardSubPage>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </motion.main>

      <AppSlimFooter className="border-slate-200/60 bg-white/40 backdrop-blur-sm" />

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
          project.estimated_min_total != null &&
          project.estimated_max_total != null
            ? (project.estimated_min_total + project.estimated_max_total) / 2
            : (project.estimated_min_total ?? project.estimated_max_total)
        }
        projectId={project.id}
        isArchitect={isArchitect}
        hasProjectPass={hasProjectPass}
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
