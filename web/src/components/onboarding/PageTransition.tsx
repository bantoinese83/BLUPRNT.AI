import React from "react";
import { motion } from "motion/react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
