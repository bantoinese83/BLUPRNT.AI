import type { ReactNode } from "react";
import { motion } from "motion/react";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardTabIntro } from "@/components/dashboard/DashboardTabIntro";

import { containerVariants, itemVariants } from "@/lib/animations";

export function DashboardSubPage({
  children,
  side,
}: {
  children: ReactNode;
  /** When omitted, main content spans full width (e.g. Tracker already has Plan vs spend in-column). */
  side?: ReactNode | null;
}) {
  const hasSide = side != null;

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
      {hasSide ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          <motion.div
            variants={itemVariants}
            className="min-w-0 lg:col-span-2 space-y-8"
          >
            {children}
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="min-w-0 flex flex-col gap-6 content-start"
          >
            {side}
          </motion.div>
        </div>
      ) : (
        <motion.div variants={itemVariants} className="min-w-0 space-y-8">
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
