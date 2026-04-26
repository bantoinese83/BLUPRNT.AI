import { motion } from "motion/react";
import { itemVariants } from "@/lib/animations";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ProjectHealth } from "@/components/dashboard/ProjectHealth";
import { DASHBOARD_SECTION_PLAN_SPENDING } from "@shared/copy/dashboard";

type DashboardOverviewProps = {
  estimatedMin: number;
  estimatedMax: number;
  spendingTotal: number;
  documentRowCount: number;
};

export function DashboardOverview({
  estimatedMin,
  estimatedMax,
  spendingTotal,
  documentRowCount,
}: DashboardOverviewProps) {
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
        />
      </div>

      <ProjectHealth
        estimatedMin={estimatedMin}
        estimatedMax={estimatedMax}
        spendingTotal={spendingTotal}
      />
    </motion.div>
  );
}
