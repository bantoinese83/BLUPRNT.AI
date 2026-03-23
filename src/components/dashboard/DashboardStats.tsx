import { Wallet, FileText, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

type DashboardStatsProps = {
  estimatedMin: number | null;
  estimatedMax: number | null;
  invoiceTotal: number;
  invoiceCount: number;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function DashboardStats({
  estimatedMin,
  estimatedMax,
  invoiceTotal,
  invoiceCount,
}: DashboardStatsProps) {
  const estimatedMid =
    (estimatedMin ?? 0) + (estimatedMax ?? 0)
      ? ((estimatedMin ?? 0) + (estimatedMax ?? 0)) / 2
      : 0;
  const budgetPct =
    estimatedMid > 0 ? Math.min(100, Math.round((invoiceTotal / estimatedMid) * 100)) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card flex flex-col items-start"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Wallet className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
            Estimate
          </span>
        </div>
        <p className="text-xl font-bold text-slate-900 tabular-nums leading-none mb-1">
          {estimatedMin != null && estimatedMax != null
            ? `${formatCurrency(estimatedMin)} – ${formatCurrency(estimatedMax)}`
            : "—"}
        </p>
        <p className="text-xs text-slate-400 font-medium">Total project range</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="glass-card flex flex-col items-start"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shadow-inner group-hover:bg-slate-600 group-hover:text-white transition-all">
            <FileText className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
            Documents
          </span>
        </div>
        <p className="text-xl font-bold text-slate-900 tabular-nums leading-none mb-1">
          {invoiceCount} <span className="text-sm font-semibold text-slate-500">{invoiceCount === 1 ? "item" : "items"}</span>
        </p>
        <p className="text-xs text-slate-400 font-medium">Invoices & quotes track</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-card flex flex-col items-start col-span-2 lg:col-span-1"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">
            Invested
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-xl font-bold text-slate-900 tabular-nums leading-none">
            {formatCurrency(invoiceTotal)}
          </p>
          {estimatedMid > 0 && invoiceTotal > 0 && (
            <motion.span 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md"
            >
              {budgetPct}%
            </motion.span>
          )}
        </div>
        <p className="text-xs text-slate-400 font-medium">Actual vs estimate</p>
      </motion.div>
    </div>
  );
}
