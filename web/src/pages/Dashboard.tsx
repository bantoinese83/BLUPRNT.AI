import { useState, useEffect, useCallback, useMemo } from "react";
import { EmptyState } from "@/components/EmptyState";
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
import { InvoicesSection } from "@/components/dashboard/InvoicesSection";
import { ProjectHealth } from "@/components/dashboard/ProjectHealth";
import { PropertyLedger } from "@/components/dashboard/PropertyLedger";
import { downloadSellerPacket } from "@/lib/seller-packet-download";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { generateActivityEvents } from "@/lib/activity";
import {
  UpgradeModal,
  type UpgradeOpenReason,
} from "@/components/dashboard/UpgradeModal";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { DashboardWelcomeBanner } from "@/components/dashboard/DashboardWelcomeBanner";
import { NextStepsChecklist } from "@/components/dashboard/NextStepsChecklist";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { ShareModal } from "@/components/dashboard/ShareModal";
import type {
  ProjectRow,
  ScopeRow,
  InvoiceRow,
  UserSubscriptionRow,
} from "@shared/types/database";
import { CONFETTI_PALETTES } from "@shared/constants/visualization";

import { motion, AnimatePresence } from "motion/react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardDataStatus } from "@/components/dashboard/DashboardDataStatus";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  containerVariants,
  itemVariants,
} from "@/components/dashboard/dashboard-animations";

import { useLogout } from "@/hooks/use-logout";
import { AwarenessProvider } from "@/contexts/AwarenessProvider";
import { useAwareness } from "@/contexts/AwarenessContext";
import { SmartSidebar } from "@/components/dashboard/SmartSidebar";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { META_ROBOTS_NOINDEX } from "@/lib/seo-meta";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { DashboardPlan } from "./dashboard/DashboardPlan";
import { DashboardScope } from "./dashboard/DashboardScope";
import { DashboardExecute } from "./dashboard/DashboardExecute";
import { DashboardRecord } from "./dashboard/DashboardRecord";
import { DeleteProjectModal } from "@/components/dashboard/DeleteProjectModal";

export default function Dashboard() {
  const {
    loading,
    refreshing,
    loadError,
    clearLoadError,
    projects,
    project,
    scopeItems,
    invoices,
    spendByCategory,
    isArchitect,
    subscription,
    hasProjectPass,
    load,
    handleProjectSelect,
    setProjects,
    setProject,
    setScopeItems,
    setInvoices,
  } = useDashboardData();

  if (!isSupabaseConfigured()) {
    return (
      <>
        <Helmet>
          <title>Can&apos;t connect — BLUPRNT.AI</title>
          <meta name="robots" content={META_ROBOTS_NOINDEX} />
        </Helmet>
        <div className="flex min-h-screen flex-col bg-slate-50">
          <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-100 bg-amber-50 shadow-sm">
              <Settings2 className="h-10 w-10 text-amber-500" aria-hidden />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Can&apos;t connect right now
              </h2>
              <p className="text-sm font-medium leading-relaxed text-slate-500">
                We couldn&apos;t reach BLUPRNT. Check your connection, try
                again, or contact support if this keeps happening.
              </p>
              <p className="text-xs font-medium leading-relaxed text-slate-400">
                This usually means environment variables aren&apos;t set for
                this deployment, or something is blocking the connection.
              </p>
            </div>
            {import.meta.env.DEV && (
              <div className="w-full space-y-2 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-left font-mono text-[10px]">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Developer
                </p>
                <p className="truncate text-slate-600">VITE_SUPABASE_URL</p>
                <p className="truncate text-slate-600">
                  VITE_SUPABASE_ANON_KEY
                </p>
              </div>
            )}
            <Button
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
          <AppSlimFooter className="bg-white/60" />
        </div>
      </>
    );
  }

  if (loading && !project) {
    return (
      <>
        <Helmet>
          <title>Loading dashboard — BLUPRNT.AI</title>
          <meta name="robots" content={META_ROBOTS_NOINDEX} />
        </Helmet>
        <DashboardSkeleton />
        <AppSlimFooter className="border-slate-200/70 bg-white/50" />
      </>
    );
  }

  if (loadError && !project && projects.length === 0) {
    return (
      <>
        <Helmet>
          <title>Couldn&apos;t load dashboard — BLUPRNT.AI</title>
          <meta name="robots" content={META_ROBOTS_NOINDEX} />
        </Helmet>
        <div className="flex min-h-screen flex-col bg-slate-50">
          <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-100 bg-amber-50">
              <Settings2 className="h-10 w-10 text-amber-600" aria-hidden />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Something went wrong
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                {loadError}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => {
                  void load();
                }}
              >
                Try again
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-slate-200"
                onClick={() => window.location.assign("/")}
              >
                Back to home
              </Button>
            </div>
          </div>
          <AppSlimFooter className="bg-white/60" />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Helmet>
          <title>Get started — BLUPRNT.AI</title>
          <meta name="robots" content={META_ROBOTS_NOINDEX} />
        </Helmet>
        <div className="flex min-h-screen flex-col bg-slate-50">
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <EmptyState
              variant="projects"
              currentStep={1}
              title="You’re all set"
              description="Add a renovation project to see your estimate, scope, and document ledger in one place. Jump straight in, or start from the short intro if you prefer a quick tour first."
              action={{
                label: "Start a project",
                onClick: () => {
                  window.location.href = "/onboarding/type";
                },
              }}
              secondaryAction={{
                label: "Begin with the intro",
                onClick: () => {
                  window.location.href = "/onboarding";
                },
              }}
              className="w-full max-w-md"
            />
          </div>
          <AppSlimFooter className="bg-white/60" />
        </div>
      </>
    );
  }

  return (
    <AwarenessProvider
      project={project}
      scopeItems={scopeItems}
      invoices={invoices}
      spendByCategory={spendByCategory}
    >
      <DashboardContent
        projects={projects}
        project={project}
        scopeItems={scopeItems}
        invoices={invoices}
        isArchitect={isArchitect}
        subscription={subscription}
        hasProjectPass={hasProjectPass}
        load={load}
        loadError={loadError}
        refreshing={refreshing}
        clearLoadError={clearLoadError}
        handleProjectSelect={handleProjectSelect}
        setProjects={setProjects}
        setProject={setProject}
        setScopeItems={setScopeItems}
        setInvoices={setInvoices}
      />
    </AwarenessProvider>
  );
}

interface DashboardContentProps {
  projects: ProjectRow[];
  project: ProjectRow;
  scopeItems: ScopeRow[];
  invoices: InvoiceRow[];
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
  load: () => Promise<void>;
  loadError: string | null;
  refreshing: boolean;
  clearLoadError: () => void;
  handleProjectSelect: (id: string) => void;
  setProjects: (projects: ProjectRow[]) => void;
  setProject: (project: ProjectRow | null) => void;
  setScopeItems: (items: ScopeRow[]) => void;
  setInvoices: (invoices: InvoiceRow[]) => void;
}

function DashboardContent({
  projects,
  project,
  scopeItems,
  invoices,
  isArchitect,
  subscription,
  hasProjectPass,
  load,
  loadError,
  refreshing,
  clearLoadError,
  handleProjectSelect,
  setProjects,
  setProject,
  setScopeItems,
  setInvoices,
}: DashboardContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useLogout();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [useDiscount, setUseDiscount] = useState(false);
  const [upgradeReason, setUpgradeReason] =
    useState<UpgradeOpenReason>("general");
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteProject, setDeleteProject] = useState<ProjectRow | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { isSidebarOpen, setIsSidebarOpen } = useAwareness();

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
        colors: [...CONFETTI_PALETTES.brandMuted],
      });
    }
  }, [location.search]);

  const [hasCelebratedFirst, setHasCelebratedFirst] = useState(false);

  useEffect(() => {
    // Celebration: Budget Reached
    if (project && invoices.length > 0 && !hasCelebrated) {
      const total = invoices.reduce(
        (s: number, i: InvoiceRow) => s + (i.total ?? 0),
        0,
      );
      if (total >= (project.estimated_min_total ?? 0)) {
        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          colors: [...CONFETTI_PALETTES.brandMuted],
        });
        setTimeout(() => setHasCelebrated(true), 100);
      }
    }
    // Celebration: First Document
    if (invoices.length === 1 && !hasCelebratedFirst) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [...CONFETTI_PALETTES.firstDocument],
      });
      setTimeout(() => setHasCelebratedFirst(true), 100);
    }
  }, [project, invoices, hasCelebrated, hasCelebratedFirst]);

  async function handleSignOut() {
    await logout("/onboarding");
  }

  const invoiceTotal = invoices.reduce(
    (s: number, i: InvoiceRow) => s + (i.total ?? 0),
    0,
  );

  const handleExportPDF = useCallback(async () => {
    if (!project) return;
    if (!isArchitect && !hasProjectPass) {
      setUpgradeReason("export");
      setShowUpgrade(true);
      return;
    }
    if (!project.property_id) {
      toast.error(
        "We need your project’s property record to export. Try refreshing the page.",
      );
      return;
    }

    const dismiss = toast.loading("Generating seller packet…");
    try {
      const scopeForPdf = scopeItems.map((s) => ({
        category: s.category,
        description: s.description,
        total_cost_min: s.total_cost_min,
        total_cost_max: s.total_cost_max,
      }));
      const { savedToProject } = await downloadSellerPacket({
        projectId: project.id,
        propertyId: project.property_id,
        project: {
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
        },
        scopeItems: scopeForPdf,
        invoices,
        includeAppendix: false,
      });
      toast.dismiss(dismiss);
      toast.success(
        savedToProject
          ? "Seller packet downloaded. A copy was saved with this project."
          : "Seller packet downloaded. Cloud copy wasn’t saved—open the Record tab and export again if you need it in your account.",
      );
    } catch {
      toast.dismiss(dismiss);
      toast.error(
        "We couldn’t generate the PDF. Check your connection and try again.",
      );
    }
  }, [project, scopeItems, invoices, isArchitect, hasProjectPass]);

   function handleProjectDelete(id: string) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setDeleteProject(p);
    setShowDeleteModal(true);
  }

  async function handleConfirmDelete() {
    if (!deleteProject || !isSupabaseConfigured()) return;

    const id = deleteProject.id;
    const originalProjects = [...projects];
    const originalCurrentProject = project;

    setProjects(projects.filter((p: ProjectRow) => p.id !== id));
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

    setShowDeleteModal(false);

    toast.promise(deleteAction(), {
      loading: "Deleting project...",
      success: () => {
        if (id === originalCurrentProject?.id) {
          load();
        }
        setDeleteProject(null);
        return "Project permanently removed";
      },
      error: () => {
        setProjects(originalProjects);
        setProject(originalCurrentProject);
        setDeleteProject(null);
        return "Failed to delete project";
      },
    });
  }

  const activityEvents = useMemo(
    () => generateActivityEvents(project, invoices),
    [project, invoices],
  );

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
        canExportSellerPacket={isArchitect || hasProjectPass}
        onExportNotAllowed={() => {
          setUpgradeReason("export");
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
      subscription={subscription}
      hasProjectPass={hasProjectPass}
    />
  );

  const handleProjectRename = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ name: newName })
        .eq("id", id);
      if (error) throw error;
      toast.success("Project renamed successfully.");
      load();
    } catch (err: unknown) {
      reportClientError("dashboard_rename_project", err);
      toast.error("Failed to rename project.");
    }
  };

  return (
    <div className="min-h-screen dashboard-bg page-fade-in">
      <Helmet>
        <title>
          {project?.name
            ? `${project.name} — BLUPRNT.AI`
            : "Dashboard — BLUPRNT.AI"}
        </title>
        <meta
          name="description"
          content="Your BLUPRNT dashboard: renovation estimates, invoices and receipts, plan vs documented spend, and project health."
        />
        <meta name="robots" content={META_ROBOTS_NOINDEX} />
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
        onOpenInsights={() => setIsSidebarOpen(true)}
      />

      <DashboardDataStatus
        loadError={loadError}
        refreshing={refreshing}
        onRetry={() => {
          void load();
        }}
        onDismissError={clearLoadError}
      />

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <ProjectSwitcher
            projects={projects.map((p: ProjectRow) => ({
              id: p.id,
              name: p.name,
              created_at: p.created_at,
              estimated_min_total: p.estimated_min_total,
            }))}
            currentId={project?.id ?? null}
            onSelect={handleProjectSelect}
            onDelete={handleProjectDelete}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ProjectHeader
            project={project}
            onRename={(newName) => handleProjectRename(project.id, newName)}
          />
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
                  if (id === "upload-quote" || id === "upload-invoice") {
                    navigate("/dashboard/execute");
                  }
                  if (id === "export-packet") handleExportPDF();
                  if (id === "review-health") {
                    navigate("/dashboard/record");
                  }
                  if (id === "share-access") {
                    setShareOpen(true);
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
                (i: InvoiceRow) => (i.document_type ?? "invoice") === "invoice",
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
            <Routes>
              <Route
                path=""
                element={<Navigate to="/dashboard/plan" replace />}
              />
              <Route
                path="plan"
                element={
                  <DashboardPlan
                    project={project}
                    scopeItems={scopeItems}
                    invoices={invoices}
                    activityEvents={activityEvents}
                    isArchitect={isArchitect}
                    hasProjectPass={hasProjectPass}
                    health={health}
                    ledger={ledger}
                    invoicesComp={invoicesComp}
                    onUpgradeClick={() => {
                      setUpgradeReason("general");
                      setShowUpgrade(true);
                    }}
                  />
                }
              />
              <Route
                path="scope"
                element={
                  <DashboardScope
                    project={project}
                    scopeItems={scopeItems}
                    onRefresh={load}
                    isArchitect={isArchitect}
                    hasProjectPass={hasProjectPass}
                  />
                }
              />
              <Route
                path="execute"
                element={
                  <DashboardExecute
                    project={project}
                    invoices={invoices}
                    health={health}
                    invoicesComp={invoicesComp}
                  />
                }
              />
              <Route
                path="record"
                element={<DashboardRecord health={health} ledger={ledger} />}
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </motion.main>

      <AppSlimFooter className="border-slate-200/60 bg-white/40 backdrop-blur-sm" />

      <ComponentErrorBoundary name="Billing">
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
      </ComponentErrorBoundary>

      <LeadCaptureModal
        onPlanSelect={(_plan) => {
          setUseDiscount(true);
          setUpgradeReason("general");
          setShowUpgrade(true);
        }}
      />
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        projectId={project?.id ?? ""}
      />
      <SmartSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <ComponentErrorBoundary name="AI Assistant">
        <AIAssistant projectId={project?.id ?? ""} />
      </ComponentErrorBoundary>

      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        projectName={deleteProject?.name ?? ""}
      />
    </div>
  );
}
