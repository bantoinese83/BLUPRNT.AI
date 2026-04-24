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
