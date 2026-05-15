import { useMemo, useCallback } from "react";
import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectHeader } from "@/components/dashboard/ProjectHeader";
import { ProjectSwitcher } from "@/components/dashboard/ProjectSwitcher";
import { generateActivityEvents } from "@/lib/activity";
import { DashboardWelcomeBanner } from "@/components/dashboard/DashboardWelcomeBanner";
import type { LedgerEntryRow, ProjectRow } from "@shared/types/database";
import { AppSlimFooter } from "@/components/layout/AppSlimFooter";
import { useAwareness } from "@/contexts/AwarenessContext";
import { SmartSidebar } from "@/components/dashboard/SmartSidebar";
import { META_ROBOTS_NOINDEX } from "@/lib/seo-meta";
import { DashboardPlan } from "./DashboardPlan";
import { DashboardScope } from "./DashboardScope";
import { DashboardExecute } from "./DashboardExecute";
import { DashboardRecord } from "./DashboardRecord";
import { DashboardDataStatus } from "@/components/dashboard/DashboardDataStatus";
import { containerVariants, itemVariants } from "@/lib/animations";

import type { DashboardContentProps } from "./dashboard-content.types";
import {
  useDashboardCheckoutSuccessConfetti,
  useDashboardUpgradeQueryEffect,
} from "./useDashboardLocationEffects";
import { useDashboardMilestoneConfetti } from "./useDashboardMilestoneConfetti";
import { DashboardActionModals } from "@/components/dashboard/DashboardActionModals";
import { useDashboardSections } from "./useDashboardSections";
import { useDashboardActions } from "./useDashboardActions";
import { DashboardFAB } from "@/components/dashboard/DashboardFAB";

export function DashboardContent({
  projects,
  project,
  scopeItems,
  ledgerEntries,
  spendByCategory: _spendByCategory,
  reconciliation,
  isArchitect,
  subscription,
  hasProjectPass,
  homeTeam: memoHomeTeam,
  investmentTotal: memoInvestmentTotal,
  load,
  loadError,
  refreshing,
  clearLoadError,
  handleProjectSelect,
  setProjects,
  setProject,
  setScopeItems,
  setLedgerEntries,
}: DashboardContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen, setIsSidebarOpen } = useAwareness();

  const {
    showUpgrade,
    setShowUpgrade,
    upgradeReason,
    setUpgradeReason,
    shareOpen,
    setShareOpen,
    deleteProject,
    showDeleteModal,
    setShowDeleteModal,
    isAssistantOpen,
    setIsAssistantOpen,
    handleSignOut,
    handleExportPDF,
    handleProjectDelete,
    handleConfirmDelete,
    handleProjectRename,
    handleProjectArchive,
  } = useDashboardActions({
    project,
    projects,
    scopeItems,
    ledgerEntries,
    isArchitect,
    hasProjectPass,
    load,
    setProjects,
    setProject,
    setScopeItems,
    setLedgerEntries,
  });

  useDashboardUpgradeQueryEffect(
    location.search,
    location.pathname,
    location.hash,
    navigate,
    setShowUpgrade,
  );
  useDashboardCheckoutSuccessConfetti(location.search, load);
  useDashboardMilestoneConfetti(project, ledgerEntries);

  const {
    health,
    homeSpecsVault,
    homeTeam,
    ledger,
    documentsComp,
    upcomingRenewals,
  } = useDashboardSections({
    project,
    projects,
    scopeItems,
    ledgerEntries,
    unreconciledBilled: reconciliation?.unreconciled_billed ?? 0,
    memoHomeTeam,
    memoInvestmentTotal,
    isArchitect,
    hasProjectPass,
    load,
    setShowUpgrade,
    setUpgradeReason,
  });

  const activityEvents = useMemo(
    () => generateActivityEvents(project, ledgerEntries as LedgerEntryRow[]),
    [project, ledgerEntries],
  );

  const projectOptions = useMemo(
    () =>
      projects.map((p: ProjectRow) => ({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        archived: p.archived,
        estimated_min_total: p.estimated_min_total,
      })),
    [projects],
  );

  const handleProjectDeleteOption = useCallback(
    (id: string) => {
      const p = projects.find((p: ProjectRow) => p.id === id);
      if (p) handleProjectDelete(p);
    },
    [projects, handleProjectDelete],
  );

  const handleProjectRenameOption = useCallback(
    (newName: string) => handleProjectRename(project.id, newName),
    [project.id, handleProjectRename],
  );

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
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-100/60"
        >
          <div className="flex-1 min-w-0">
            <ProjectHeader
              project={project}
              onRename={handleProjectRenameOption}
            />
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <ProjectSwitcher
              projects={projectOptions}
              currentId={project?.id ?? null}
              onSelect={handleProjectSelect}
              onDelete={handleProjectDeleteOption}
              onArchive={handleProjectArchive}
            />
          </div>
        </motion.div>

        {ledgerEntries.length === 0 && (
          <motion.div variants={itemVariants}>
            <DashboardWelcomeBanner
              hasDocuments={false}
              onAction={(id) => {
                if (id === "upload") navigate("/dashboard/execute");
                if (id === "scope") navigate("/dashboard/scope");
                if (id === "export") void handleExportPDF();
              }}
            />
          </motion.div>
        )}

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
                    ledgerEntries={ledgerEntries}
                    activityEvents={activityEvents}
                    reconciliation={reconciliation}
                    isArchitect={isArchitect}
                    hasProjectPass={hasProjectPass}
                    homeTeam={homeTeam}
                    homeSpecsVault={homeSpecsVault}
                    documentsComp={documentsComp}
                    upcomingRenewals={upcomingRenewals}
                    onUpgradeClick={() => setShowUpgrade(true)}
                    onExportPDF={handleExportPDF}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                    setUpgradeReason={setUpgradeReason}
                    setShareOpen={setShareOpen}
                  />
                }
              />
              <Route
                path="scope"
                element={
                  <DashboardScope
                    project={project}
                    scopeItems={scopeItems}
                    ledgerEntries={ledgerEntries}
                    reconciliation={reconciliation}
                    onRefresh={load}
                    isArchitect={isArchitect}
                    hasProjectPass={hasProjectPass}
                    homeTeam={homeTeam}
                  />
                }
              />
              <Route
                path="execute"
                element={
                  <DashboardExecute
                    project={project}
                    ledgerEntries={ledgerEntries}
                    documentsComp={documentsComp}
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

      <DashboardActionModals
        project={project}
        showUpgrade={showUpgrade}
        setShowUpgrade={setShowUpgrade}
        upgradeReason={upgradeReason}
        setUpgradeReason={setUpgradeReason}
        shareOpen={shareOpen}
        setShareOpen={setShareOpen}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        deleteProjectName={deleteProject?.name ?? ""}
        handleConfirmDelete={handleConfirmDelete}
        isAssistantOpen={isAssistantOpen}
        setIsAssistantOpen={setIsAssistantOpen}
        isArchitect={isArchitect}
        subscription={subscription}
        hasProjectPass={hasProjectPass}
      />

      <DashboardFAB
        onUpload={() => navigate("/dashboard/execute")}
        onAddScope={() => navigate("/dashboard/scope")}
        onAskAI={() => setIsAssistantOpen(true)}
      />

      <SmartSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}
