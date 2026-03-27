import { useState, useEffect, useCallback } from "react";
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
import { Settings2, ListTree } from "lucide-react";
import { toast } from "sonner";
import { ShareModal } from "@/components/dashboard/ShareModal";

import { motion, AnimatePresence } from "motion/react";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { Button } from "@/components/ui/button";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import {
  containerVariants,
  itemVariants,
} from "@/components/dashboard/dashboard-animations";

import { useLogout } from "@/hooks/use-logout";
import { AwarenessProvider, useAwareness } from "@/contexts/AwarenessProvider";
import { SmartSidebar } from "@/components/dashboard/SmartSidebar";
import { AIAssistant } from "@/components/dashboard/AIAssistant";

export default function Dashboard() {
  const {
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
  } = useDashboardData();

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
        <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm animate-pulse">
            <Settings2 className="h-10 w-10 text-amber-500" aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Connection Required
            </h2>
            <p className="text-sm leading-relaxed text-slate-500 font-medium">
              We&apos;re having trouble connecting to the database. This usually
              means the environment keys are missing or the connection was
              interrupted.
            </p>
          </div>
          <div className="w-full p-4 rounded-2xl bg-slate-100 border border-slate-200 text-left space-y-2 font-mono text-[10px]">
            <p className="text-slate-400 uppercase tracking-widest font-bold mb-2">
              Developer Note:
            </p>
            <p className="text-slate-600 truncate">
              VITE_SUPABASE_URL: missing
            </p>
            <p className="text-slate-600 truncate">
              VITE_SUPABASE_ANON_KEY: missing
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-slate-200"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </Button>
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
              onClick: () => { window.location.href = "/onboarding"; },
            }}
            className="w-full max-w-md"
          />
        </div>
        <AppSlimFooter className="bg-white/60" />
      </div>
    );
  }

  return (
    <AwarenessProvider
      project={project}
      scopeItems={scopeItems}
      invoices={invoices}
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
        handleProjectSelect={handleProjectSelect}
        setProjects={setProjects}
        setProject={setProject}
        setScopeItems={setScopeItems}
        setInvoices={setInvoices}
      />
    </AwarenessProvider>
  );
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
  handleProjectSelect,
  setProjects,
  setProject,
  setScopeItems,
  setInvoices,
}: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useLogout();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [useDiscount, setUseDiscount] = useState(false);
  const [upgradeReason, setUpgradeReason] =
    useState<UpgradeOpenReason>("general");
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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
        colors: ["#6366f1", "#020617", "#94a3b8"],
      });
    }
  }, [location.search]);

  useEffect(() => {
    if (project && invoices.length > 0 && !hasCelebrated) {
      const total = invoices.reduce((s: number, i: any) => s + (i.total ?? 0), 0);
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
    await logout("/onboarding");
  }

  const invoiceTotal = invoices.reduce((s: number, i: any) => s + (i.total ?? 0), 0);

  const handleExportPDF = useCallback(async () => {
    if (!project) return;
    await generateDashboardSummaryPDF(project, invoices, invoiceTotal);
    toast.success("Project summary exported to PDF");
  }, [project, invoices, invoiceTotal]);

  async function handleProjectDelete(id: string) {
    if (!isSupabaseConfigured()) return;

    const originalProjects = [...projects];
    const originalCurrentProject = project;

    setProjects(projects.filter((p: any) => p.id !== id));
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
        if (id === originalCurrentProject?.id) {
          load();
        }
        return "Project permanently removed";
      },
      error: () => {
        setProjects(originalProjects);
        setProject(originalCurrentProject);
        return "Failed to delete project";
      },
    });
  }

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
        onOpenInsights={() => setIsSidebarOpen(true)}
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
            projects={projects.map((p: any) => ({ id: p.id, name: p.name }))}
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
                (i: any) => (i.document_type ?? "invoice") === "invoice",
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
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        projectId={project?.id ?? ""}
      />
      <SmartSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <AIAssistant projectId={project?.id ?? ""} />
    </div>
  );
}
