import { memo, useMemo } from "react";
import { motion } from "motion/react";
import { itemVariants } from "@/lib/animations";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ProjectHealth } from "@/components/dashboard/ProjectHealth";
import { ResaleValueImpact } from "@/components/dashboard/ResaleValueImpact";
import { InsightTeaser } from "@/components/dashboard/InsightTeaser";
import { DASHBOARD_SECTION_PLAN_SPENDING } from "@shared/copy/dashboard";
import { calculateResaleImpact } from "@shared/lib/resale-value";

type DashboardOverviewProps = {
  estimatedMin: number;
  estimatedMax: number;
  spendingTotal: number;
  documentRowCount: number;
  scopeLineCount?: number;
  unreconciledBilled?: number;
  projectName: string;
  isArchitect: boolean;
  hasProjectPass: boolean;
  onUpgradeClick: () => void;
  onStatClick?: (statId: "estimate" | "documents" | "invested") => void;
};

export const DashboardOverview = memo(function DashboardOverview({
  estimatedMin,
  estimatedMax,
  spendingTotal,
  documentRowCount,
  scopeLineCount = 0,
  unreconciledBilled = 0,
  projectName,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
  onStatClick,
}: DashboardOverviewProps) {
  const resaleImpact = useMemo(
    () => calculateResaleImpact(spendingTotal),
    [spendingTotal],
  );

  const isUnlocked = isArchitect || hasProjectPass;
  return (
    <motion.div variants={itemVariants} className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
          {DASHBOARD_SECTION_PLAN_SPENDING}
        </h3>
        <DashboardStats
          estimatedMin={estimatedMin}
          estimatedMax={estimatedMax}
          spendingTotal={spendingTotal}
          documentRowCount={documentRowCount}
          unreconciledBilled={unreconciledBilled}
          onStatClick={onStatClick}
        />
      </div>

      <div id="project-health-anchor">
        <ProjectHealth
          estimatedMin={estimatedMin}
          estimatedMax={estimatedMax}
          spendingTotal={spendingTotal}
          documentCount={documentRowCount}
          scopeLineCount={scopeLineCount}
          unreconciledBilled={unreconciledBilled}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div id="resale-impact-anchor">
          <ResaleValueImpact
            investment={spendingTotal}
            resaleImpact={resaleImpact}
            projectName={projectName}
          />
        </div>
        <div className="space-y-6">
          {!isUnlocked && (
            <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <InsightTeaser
                onUpgradeClick={onUpgradeClick}
                projectName={projectName}
              />
            </div>
          )}
          {/* We could add more cards here like a localized market trend or similar */}
        </div>
      </div>
    </motion.div>
  );
});
