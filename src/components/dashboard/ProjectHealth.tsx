import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Shield, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

type ProjectHealthProps = {
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  invoiceTotal?: number;
};

function getHealthGrade(
  estimatedMid: number,
  invoiceTotal: number,
  overBudget: boolean
): { grade: string; label: string } {
  if (estimatedMid === 0 || invoiceTotal === 0) {
    return { grade: "—", label: "Start tracking" };
  }
  const pct = (invoiceTotal / estimatedMid) * 100;
  if (overBudget) return { grade: "C", label: "Over budget" };
  if (pct >= 90) return { grade: "B", label: "Nearly complete" };
  if (pct >= 50) return { grade: "A", label: "On track" };
  if (pct >= 25) return { grade: "A+", label: "Early stage" };
  return { grade: "A+", label: "Just started" };
}

export function ProjectHealth({
  estimatedMin = 0,
  estimatedMax = 0,
  invoiceTotal = 0,
}: ProjectHealthProps) {
  const estimatedMid = (estimatedMin ?? 0) + (estimatedMax ?? 0) ? ((estimatedMin ?? 0) + (estimatedMax ?? 0)) / 2 : 0;
  const pct = estimatedMid > 0 ? Math.min(100, Math.round((invoiceTotal / estimatedMid) * 100)) : 0;
  const overBudget = estimatedMid > 0 && invoiceTotal > (estimatedMax ?? estimatedMid);
  const variance = estimatedMid > 0 ? invoiceTotal - estimatedMid : 0;
  const { grade, label } = getHealthGrade(estimatedMid, invoiceTotal, overBudget);

  const statusColor = overBudget ? "text-amber-400" : "text-white";


  return (
    <Card className="glass-dark text-white border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden relative">
      <div className={`absolute -top-12 -right-12 w-32 h-32 ${overBudget ? "bg-amber-500/10" : "bg-white/10"} blur-3xl rounded-full`} />

      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Shield className={`w-4 h-4 ${overBudget ? "text-amber-400" : "text-slate-300"}`} strokeWidth={2.5} />
            <span>Health Score</span>
          </CardTitle>

          <div className="relative flex items-center justify-center w-12 h-12">
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${overBudget ? "border-amber-500/30" : "border-slate-500/30"}`}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <span className={`text-4xl font-black tabular-nums ${statusColor}`}>
              {grade}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
            <span className="text-sm font-black tabular-nums">{pct}% Tracked</span>
          </div>
          <div className="relative w-full h-3 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, pct)}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`absolute top-0 left-0 h-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.1)] ${
                overBudget ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-slate-400 to-slate-200"
              }`}

            />
          </div>
          <div className="flex justify-between px-1">
             <div className="h-1.5 w-[2px] bg-slate-700 rounded-full" />
             <div className="h-1.5 w-[2px] bg-slate-700 rounded-full" />
             <div className="h-1.5 w-[2px] bg-slate-700 rounded-full" />
             <div className="h-1.5 w-[2px] bg-slate-800 rounded-full" />
          </div>
        </div>

        {invoiceTotal > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50"
          >
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Utilized</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(invoiceTotal)}
              </span>
            </div>
            
            <div className={`flex justify-between items-center pt-2 border-t border-slate-800/50 ${variance > 0 ? "text-amber-400" : "text-slate-300"}`}>

              <div className="flex items-center gap-2">
                {variance > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5 opacity-50" />}
                <span className="text-[11px] font-extrabold uppercase tracking-widest">
                   {variance > 0 ? "Drift" : "Margin"}
                </span>
              </div>
              <span className="text-sm font-black tabular-nums">
                {variance > 0 ? "+" : ""}
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(variance)}
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="p-4 bg-slate-500/10 rounded-2xl text-xs text-slate-300 flex gap-3 border border-slate-500/20 leading-relaxed font-medium">
            <Receipt className="w-5 h-5 text-slate-400 shrink-0 opacity-80" aria-hidden />
            <span>Upload invoices to see real-time health and budget performance.</span>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
