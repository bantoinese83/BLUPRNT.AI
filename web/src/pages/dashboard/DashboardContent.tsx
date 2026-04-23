import { useState, useCallback, useMemo } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

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
import {
  DASHBOARD_SECTION_GUIDED_PATH,
  DASHBOARD_SECTION_PLAN_SPENDING,
} from "@shared/copy/dashboard";
import { ShareModal } from "@/components/dashboard/ShareModal";
import type { InvoiceRow, ProjectRow } from "@shared/types/database";
import { capitalImprovementTotal } from "@/lib/plan-vs-actual";

import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { useLogout } from "@/hooks/use-logout";
import { useAwareness } from "@/contexts/AwarenessContext";
import { SmartSidebar } from "@/components/dashboard/SmartSidebar";
import { META_ROBOTS_NOINDEX } from "@/lib/seo-meta";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { DashboardPlan } from "./DashboardPlan";
import { DashboardScope } from "./DashboardScope";
import { DashboardExecute } from "./DashboardExecute";
import { DashboardRecord } from "./DashboardRecord";
import { DeleteProjectModal } from "@/components/dashboard/DeleteProjectModal";
import { DashboardDataStatus } from "@/components/dashboard/DashboardDataStatus";
import {
  containerVariants,
  itemVariants,
} from "@/components/dashboard/dashboard-animations";

import type { DashboardContentProps } from "./dashboard-content.types";
import {
  useDashboardCheckoutSuccessConfetti,
  useDashboardUpgradeQueryEffect,
} from "./useDashboardLocationEffects";
import { useDashboardMilestoneConfetti } from "./useDashboardMilestoneConfetti";
import { TransformationSlider } from "@/components/dashboard/TransformationSlider";
import { HomeTeamSection } from "@/components/dashboard/HomeTeamSection";

export function DashboardContent({
  projects,
  project,
  scopeItems,
  invoices,
  spendByCategory: _spendByCategory,
  reconciliation,
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
  const [_useDiscount, setUseDiscount] = useState(false);
  const [_upgradeReason, setUpgradeReason] =
    useState<UpgradeOpenReason>("general");
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteProject, setDeleteProject] = useState<ProjectRow | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { isSidebarOpen, setIsSidebarOpen } = useAwareness();

  useDashboardUpgradeQueryEffect(
    location.search,
    location.pathname,
    location.hash,
    navigate,
    setShowUpgrade,
  );
  useDashboardCheckoutSuccessConfetti(location.search, load);
  useDashboardMilestoneConfetti(project, invoices);

  const capitalDocumentedTotal = useMemo(
    () => capitalImprovementTotal(invoices),
    [invoices],
  );

  const handleSignOut = useCallback(async () => {
    await logout();
    navigate("/");
  }, [logout, navigate]);

  const handleExportPDF = useCallback(() => {
    if (!isArchitect && !hasProjectPass) {
      setUpgradeReason("export");
      setShowUpgrade(true);
      return;
    }
    void downloadSellerPacket({
      projectId: project.id,
      propertyId: project.property_id,
      project: {
        name: project.name,
        estimated_min_total: project.estimated_min_total,
        estimated_max_total: project.estimated_max_total,
      },
      scopeItems,
      invoices,
    });
  }, [project, scopeItems, invoices, isArchitect, hasProjectPass]);

  const handleProjectDelete = (p: ProjectRow) => {
    setDeleteProject(p);
    setShowDeleteModal(true);
  };

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
        return "Failed to delete project. Check your connection and try again.";
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
      invoiceTotal={capitalDocumentedTotal}
      invoiceCount={invoices.length}
    />
  );

  const health = (
    <ProjectHealth
      estimatedMin={project.estimated_min_total}
      estimatedMax={project.estimated_max_total}
      invoiceTotal={capitalDocumentedTotal}
    />
  );

  const transformation = (
    <TransformationSlider
      projectId={project.id}
      beforePath={project.before_photo_storage_path}
      afterPath={project.after_photo_storage_path}
      isArchitect={isArchitect}
      hasProjectPass={hasProjectPass}
      onUpgradeClick={() => setShowUpgrade(true)}
      onRefresh={load}
    />
  );

  const homeTeam = (
    <HomeTeamSection
      invoices={invoices}
      isArchitect={isArchitect}
      hasProjectPass={hasProjectPass}
      onUpgradeClick={() => setShowUpgrade(true)}
    />
  );

  const ledger = (
    <div className="space-y-6">
      <ResaleValueImpact
        investment={capitalDocumentedTotal}
        projectName={project.name}
      />
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
      toast.error("Failed to rename project.", {
        description: "Check your connection and try again.",
      });
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
            onDelete={(id) => {
              const p = projects.find((proj) => proj.id === id);
              if (p) handleProjectDelete(p);
            }}
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

        <motion.div variants={itemVariants}>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              {DASHBOARD_SECTION_PLAN_SPENDING}
            </h3>
            {stats}
          </div>
        </motion.div>

        {project && (
          <motion.div variants={itemVariants}>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                {DASHBOARD_SECTION_GUIDED_PATH}
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
                    reconciliation={reconciliation}
                    isArchitect={isArchitect}
                    hasProjectPass={hasProjectPass}
                    health={health}
                    homeTeam={homeTeam}
                    transformation={transformation}
                    ledger={ledger}
                    invoicesComp={invoicesComp}
                    onUpgradeClick={() => setShowUpgrade(true)}
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
                    health={health}
                    homeTeam={homeTeam}
                    transformation={transformation}
                    ledger={ledger}
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
        />
      </ComponentErrorBoundary>

      <LeadCaptureModal />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        projectId={project.id}
      />

      <SmartSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        projectName={deleteProject?.name ?? ""}
      />
    </div>
  );
}
