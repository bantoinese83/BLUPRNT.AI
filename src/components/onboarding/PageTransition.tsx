import React from "react";
import { motion } from "motion/react";

export function PageTransition({ 
  children, 
  duration = 0.3 
}: { 
  children: React.ReactNode;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration, ease: "easeInOut" }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
