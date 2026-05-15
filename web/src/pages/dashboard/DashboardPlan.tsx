import { useLocation, useNavigate } from "react-router-dom";
import { ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstimateSummary } from "@/components/dashboard/EstimateSummary";
import {
  ActivityFeed,
  type ActivityEvent,
} from "@/components/dashboard/ActivityFeed";
import { DashboardSubPage } from "@/components/dashboard/DashboardSubPage";
import { GroundingSourcesSection } from "@/components/dashboard/GroundingSourcesSection";
import { ComponentErrorBoundary } from "@/components/ComponentErrorBoundary";
import { motion } from "motion/react";
import { itemVariants } from "@/lib/animations";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { ProductionReadinessCard } from "@/components/dashboard/ProductionReadinessCard";
import { NextStepsChecklist } from "@/components/dashboard/NextStepsChecklist";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { DASHBOARD_SECTION_GUIDED_PATH } from "@shared/copy/dashboard";
import { countBillOrReceiptUploadsInProject } from "@shared/lib/ledger-entry-quota";
import type { UpgradeOpenReason } from "@/components/dashboard/UpgradeModal";
import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryRow,
} from "@shared/types/database";
import type { ReconciliationResult } from "@shared/lib/reconciliation";

interface DashboardPlanProps {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryRow[];
  activityEvents: ActivityEvent[];
  reconciliation: ReconciliationResult | null;
  isArchitect: boolean;
  hasProjectPass: boolean;
  homeTeam: React.ReactNode;
  homeSpecsVault: React.ReactNode;
  documentsComp: React.ReactNode;
  upcomingRenewals?: React.ReactNode;
  onUpgradeClick: () => void;
  onExportPDF: () => void;
  onOpenSidebar: () => void;
  setUpgradeReason: (reason: UpgradeOpenReason) => void;
  setShareOpen: (open: boolean) => void;
}

export function DashboardPlan({
  project,
  scopeItems,
  ledgerEntries,
  activityEvents,
  reconciliation,
  isArchitect,
  hasProjectPass,
  homeTeam,
  homeSpecsVault,
  documentsComp,
  upcomingRenewals,
  onUpgradeClick,
  onExportPDF,
  onOpenSidebar,
  setUpgradeReason,
  setShareOpen,
}: DashboardPlanProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <DashboardSubPage
      side={
        <div className="space-y-8">
          {homeSpecsVault}
          {upcomingRenewals}
          <GroundingSourcesSection project={project} />
          {homeTeam}
          <div id="activity-feed-anchor">
            {location.pathname.endsWith("/plan") && (
              <ActivityFeed events={activityEvents} />
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-12">
        <div id="dashboard-stats-anchor">
          <DashboardOverview
            estimatedMin={project.estimated_min_total ?? 0}
            estimatedMax={project.estimated_max_total ?? 0}
            spendingTotal={ledgerEntries.reduce(
              (acc, curr) => acc + (curr.total || 0),
              0,
            )}
            documentRowCount={ledgerEntries.length}
            scopeLineCount={scopeItems.length}
            unreconciledBilled={reconciliation?.unreconciled_billed ?? 0}
            projectName={project.name}
            isArchitect={isArchitect}
            hasProjectPass={hasProjectPass}
            onUpgradeClick={onUpgradeClick}
            onStatClick={(statId) => {
              if (statId === "estimate") navigate("/dashboard/scope");
              if (statId === "documents" || statId === "invested")
                navigate("/dashboard/execute");
            }}
          />
        </div>

        <motion.div variants={itemVariants} id="production-readiness-anchor">
          <ProductionReadinessCard
            documentCount={ledgerEntries.length}
            hasQuotes={ledgerEntries.some(
              (e: LedgerEntryRow) => e.document_type === "quote",
            )}
            hasInvoices={ledgerEntries.some(
              (e: LedgerEntryRow) => e.document_type === "invoice",
            )}
            onPressAudit={onOpenSidebar}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              {DASHBOARD_SECTION_GUIDED_PATH}
            </h3>
            <NextStepsChecklist
              stage={project.stage || "planning"}
              ledgerEntries={ledgerEntries}
              onAction={(id) => {
                if (id === "review-scope") navigate("/dashboard/scope");
                if (id === "upload-quote" || id === "upload-document") {
                  navigate("/dashboard/execute");
                }
                if (id === "export-packet") onExportPDF();
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

        <motion.div variants={itemVariants}>
          <UpgradeBanner
            invoiceCount={countBillOrReceiptUploadsInProject(ledgerEntries)}
            onUpgradeClick={() => {
              setUpgradeReason("ledger_limit");
              onUpgradeClick();
            }}
            isArchitect={isArchitect}
            hasProjectPass={hasProjectPass}
          />
        </motion.div>

        <div className="space-y-6">
          <EstimateSummary
            project={project}
            scopeItems={scopeItems}
            ledgerEntries={ledgerEntries}
            reconciliation={reconciliation}
            isArchitect={isArchitect}
            hasProjectPass={hasProjectPass}
            onUpgradeClick={onUpgradeClick}
          />
          <Button
            variant="outline"
            className="w-full gap-2 rounded-xl border-slate-200 hover:bg-slate-50"
            onClick={() => navigate("/dashboard/scope")}
            type="button"
          >
            <ListTree className="w-5 h-5 shrink-0" aria-hidden />
            View full budget
          </Button>
          <ComponentErrorBoundary name="Documents Ledger">
            {documentsComp}
          </ComponentErrorBoundary>
        </div>
      </div>
    </DashboardSubPage>
  );
}
