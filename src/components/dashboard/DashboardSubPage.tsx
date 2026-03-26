import type { ReactNode } from "react";
import { motion } from "motion/react";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardTabIntro } from "@/components/dashboard/DashboardTabIntro";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
    },
  },
} as const;

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
