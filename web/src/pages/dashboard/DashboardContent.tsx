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
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { generateActivityEvents } from "@/lib/activity";
import { DashboardWelcomeBanner } from "@/components/dashboard/DashboardWelcomeBanner";
import { NextStepsChecklist } from "@/components/dashboard/NextStepsChecklist";
import { DASHBOARD_SECTION_GUIDED_PATH } from "@shared/copy/dashboard";
import type { LedgerEntryRow, ProjectRow } from "@shared/types/database";
import { countBillOrReceiptUploadsInProject } from "@shared/lib/ledger-entry-quota";

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
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { DashboardActionModals } from "@/components/dashboard/DashboardActionModals";
import { useDashboardSections } from "./useDashboardSections";
import { useDashboardActions } from "./useDashboardActions";

export function DashboardContent({
  projects,
  project,
  scopeItems,
  ledgerEntries,
  spendByCategory: _spendByCategory,
  reconciliation,
  isArchitect,
  subscription: _subscription,
  hasProjectPass,
  homeTeam: memoHomeTeam,
  investmentTotal: memoInvestmentTotal,
  resaleImpact: memoResaleImpact,
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
    transformationVault,
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
    memoResaleImpact,
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
        onOpenInsights={() => setIsSidebarOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
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
            projects={projectOptions}
            currentId={project?.id ?? null}
            onSelect={handleProjectSelect}
            onDelete={handleProjectDeleteOption}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ProjectHeader
            project={project}
            onRename={handleProjectRenameOption}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <DashboardWelcomeBanner />
        </motion.div>

        <DashboardOverview
          estimatedMin={project.estimated_min_total ?? 0}
          estimatedMax={project.estimated_max_total ?? 0}
          spendingTotal={memoInvestmentTotal}
          documentRowCount={ledgerEntries.length}
          scopeLineCount={scopeItems.length}
          unreconciledBilled={reconciliation?.unreconciled_billed ?? 0}
          projectName={project.name}
          isArchitect={isArchitect}
          hasProjectPass={hasProjectPass}
          onUpgradeClick={() => setShowUpgrade(true)}
        />

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
                  if (id === "upload-quote" || id === "upload-document") {
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
            invoiceCount={countBillOrReceiptUploadsInProject(ledgerEntries)}
            onUpgradeClick={() => {
              setUpgradeReason("ledger_limit");
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
                    ledgerEntries={ledgerEntries}
                    activityEvents={activityEvents}
                    reconciliation={reconciliation}
                    isArchitect={isArchitect}
                    hasProjectPass={hasProjectPass}
                    health={health}
                    homeTeam={homeTeam}
                    transformationVault={transformationVault}
                    homeSpecsVault={homeSpecsVault}
                    ledger={ledger}
                    documentsComp={documentsComp}
                    upcomingRenewals={upcomingRenewals}
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
                    ledgerEntries={ledgerEntries}
                    reconciliation={reconciliation}
                    onRefresh={load}
                    isArchitect={isArchitect}
                    hasProjectPass={hasProjectPass}
                    health={health}
                    homeTeam={homeTeam}
                    transformationVault={transformationVault}
                    ledger={ledger}
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
      />

      <SmartSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}
