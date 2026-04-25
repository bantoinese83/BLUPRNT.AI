import { motion } from "motion/react";
import { Wrench } from "lucide-react";

interface EstimateHeaderProps {
  area: string;
  fallbackLine?: string | null;
}

export function EstimateHeader({ area, fallbackLine }: EstimateHeaderProps) {
  return (
    <div className="space-y-2 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="inline-flex items-center justify-center p-2 bg-teal-50 rounded-full mb-2"
      >
        <Wrench className="w-5 h-5 text-teal-600" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold tracking-tight text-slate-900"
      >
        Your BLUPRNT is Ready
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-500 lg:text-lg"
      >
        Based on current market data for {area}.
      </motion.p>
      {fallbackLine ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-auto max-w-lg rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950"
          role="status"
        >
          {fallbackLine}
        </motion.p>
      ) : null}
    </div>
  );
}
