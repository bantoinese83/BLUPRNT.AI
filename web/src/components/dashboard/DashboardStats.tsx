import { useEffect } from "react";
import { Wallet, FileText, TrendingUp, Info } from "lucide-react";
import { useSpring, useTransform, motion } from "motion/react";
import { money } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { calculateBudgetStats } from "@/lib/plan-vs-actual";
import { DASHBOARD_STATS_LABELS } from "@shared/copy/dashboard";
import { Tooltip } from "../ui/tooltip";

type DashboardStatsProps = {
  estimatedMin: number | null;
  estimatedMax: number | null;
  spendingTotal: number;
  /** All ledger files (invoices, quotes, permits, every type) — not the Free 3 "bill" cap. */
  documentRowCount: number;
  unreconciledBilled?: number;
  isLoading?: boolean;
  onStatClick?: (statId: "estimate" | "documents" | "invested") => void;
};

function StatSkeleton() {
  return (
    <div className="glass-card flex flex-col items-start p-5 sm:p-6 bg-slate-50/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100" />
        <div className="h-3 w-16 bg-slate-100 rounded" />
      </div>
      <div className="h-8 w-32 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-24 bg-slate-50 rounded" />
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 50, damping: 15 });
  const display = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

function AnimatedMoney({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 40, damping: 12 });
  const display = useTransform(spring, (latest) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(latest),
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className="tabular-nums">{display}</motion.span>;
}

export function DashboardStats({
  estimatedMin,
  estimatedMax,
  spendingTotal,
  documentRowCount,
  unreconciledBilled = 0,
  isLoading = false,
  onStatClick,
}: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
    );
  }

  const { budgetPct, statusLabel } = calculateBudgetStats(
    estimatedMin,
    estimatedMax,
    spendingTotal,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3 }}
        onClick={() => onStatClick?.("estimate")}
        className="glass-card flex flex-col items-start p-5 sm:p-6 text-left w-full transition-all"
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-inner"
          >
            <Wallet className="w-5 h-5" strokeWidth={2.5} />
          </motion.div>
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            {DASHBOARD_STATS_LABELS.estimate}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none mb-1.5 truncate">
            {money(estimatedMin, estimatedMax)}
          </p>
          <p className="text-xs text-slate-400 font-bold truncate">
            {DASHBOARD_STATS_LABELS.estimateSub}
          </p>
        </div>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        onClick={() => onStatClick?.("documents")}
        className="glass-card flex flex-col items-start p-5 sm:p-6 text-left w-full transition-all"
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-inner"
          >
            <FileText className="w-5 h-5" strokeWidth={2.5} />
          </motion.div>
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            {DASHBOARD_STATS_LABELS.documents}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none mb-1.5 truncate">
            <AnimatedNumber value={documentRowCount} />{" "}
            <span className="text-sm font-bold text-slate-400">
              {documentRowCount === 1 ? "file" : "files"}
            </span>
          </p>
          <p className="text-xs text-slate-400 font-bold truncate">
            {DASHBOARD_STATS_LABELS.documentsSub}
          </p>
        </div>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        onClick={() => onStatClick?.("invested")}
        className="glass-card flex flex-col items-start p-5 sm:p-6 text-left w-full transition-all sm:col-span-2 lg:col-span-1"
      >
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.1, y: -2 }}
            className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shadow-inner"
          >
            <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
          </motion.div>
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            {DASHBOARD_STATS_LABELS.invested}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1.5 min-w-0">
          <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none">
            <AnimatedMoney value={spendingTotal} />
          </p>
          {estimatedMin !== null && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                statusLabel === "Over"
                  ? {
                      opacity: 1,
                      scale: [1, 1.05, 1],
                    }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                statusLabel === "Over"
                  ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
              className={cn(
                "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm border whitespace-nowrap",
                statusLabel === "Over"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : statusLabel === "Under"
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200",
              )}
            >
              {statusLabel === "Over" && "⚠️ "}
              {statusLabel === "Under" && "↓ "}
              {statusLabel === "Matched" && "✓ "}
              {statusLabel} • {budgetPct}%
            </motion.span>
          )}
        </div>
        <div className="text-xs text-slate-400 font-bold">
          {DASHBOARD_STATS_LABELS.investedSub}
          {unreconciledBilled > 0 && (
            <Tooltip
              content="This spend is in your archive but hasn't been matched to a specific budget line item."
              className="max-w-[200px]"
            >
              <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded cursor-help transition-colors hover:bg-amber-100">
                <Info className="w-2.5 h-2.5" />
                {money(unreconciledBilled)} unlinked
              </span>
            </Tooltip>
          )}
        </div>
      </motion.button>
    </div>
  );
}
