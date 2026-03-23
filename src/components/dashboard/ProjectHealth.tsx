import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

type ProjectHealthProps = {
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  invoiceTotal?: number;
};

function calculateHealthScore(
  invoiceTotal: number,
  min: number,
  max: number
): { score: number; status: string; color: string; message: string; stop1: string; stop2: string } {
  if (min === 0 || invoiceTotal === 0) {
    return { 
      score: 0, 
      status: "Analyzing", 
      color: "from-slate-400 to-slate-500",
      stop1: "#94a3b8",
      stop2: "#64748b",
      message: "Processing your initial project data..." 
    };
  }

  const progressPct = (invoiceTotal / min) * 100;
  const budgetUtilization = (invoiceTotal / max) * 100;
  
  if (budgetUtilization > 100) {
    const overPct = budgetUtilization - 100;
    return {
      score: Math.max(0, Math.round(70 - overPct)),
      status: "Over Budget",
      color: "from-rose-500 to-orange-600",
      stop1: "#f43f5e",
      stop2: "#ea580c",
      message: "Careful! You've exceeded your lifecycle estimate."
    };
  } 
  
  if (budgetUtilization > 85) {
    return {
      score: 75,
      status: "At Limit",
      color: "from-amber-400 to-orange-500",
      stop1: "#fbbf24",
      stop2: "#f59e0b",
      message: "You're approaching the upper limit of your budget."
    };
  } 

  if (progressPct > 90) {
    return {
      score: 95,
      status: "Verified",
      color: "from-blue-400 to-indigo-500",
      stop1: "#60a5fa",
      stop2: "#6366f1",
      message: "Phase verified. Documentation is at peak efficiency."
    };
  } 

  return {
    score: 100,
    status: "Optimum",
    color: "from-emerald-400 to-cyan-500",
    stop1: "#34d399",
    stop2: "#06b6d4",
    message: "Your ledger is perfectly aligned with regional averages."
  };
}

export function ProjectHealth({
  estimatedMin = 0,
  estimatedMax = 0,
  invoiceTotal = 0,
}: ProjectHealthProps) {
  const min = estimatedMin ?? 0;
  const max = estimatedMax ?? 0;
  const progressPct = min > 0 ? Math.min(100, Math.round((invoiceTotal / min) * 100)) : 0;
  const { score, status, color, message, stop1, stop2 } = calculateHealthScore(invoiceTotal, min, max);

  const isWarning = status === "Over Budget" || status === "At Limit";

  return (
    <Card className="glass-dark text-white border-slate-800/50 shadow-2xl rounded-3xl overflow-hidden relative group">
      <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${color} opacity-[0.08] blur-3xl rounded-full transition-all duration-700 group-hover:opacity-15`} />
      
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Shield className={`w-4 h-4 ${isWarning ? "text-amber-400" : "text-emerald-400"}`} strokeWidth={2.5} />
            <span>Health Score</span>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-black tracking-tighter tabular-nums bg-gradient-to-br ${color} bg-clip-text text-transparent`}>
                {score}
              </span>
              <span className="text-slate-500 text-lg font-bold">/100</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-0.5 rounded-full bg-gradient-to-br ${color} text-[10px] font-black uppercase tracking-widest text-white`}>
                {status}
              </div>
              {invoiceTotal > 0 && (
                 <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                   <TrendingUp className="w-3 h-3" />
                   Live
                 </div>
              )}
            </div>
          </div>

          <div className="relative w-24 h-24 mb-1">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="38"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800/40"
              />
              <motion.circle
                cx="48"
                cy="48"
                r="38"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 38}
                initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 38 * (1 - score / 100) }}
                transition={{ duration: 2, ease: "easeOut" }}
                style={{ stroke: 'url(#gradient-health)' }}
              />
              <defs>
                <linearGradient id="gradient-health" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={stop1} />
                  <stop offset="100%" stopColor={stop2} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
               <Shield className={`w-8 h-8 opacity-10 ${isWarning ? "text-amber-400" : "text-emerald-400"}`} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Tracked</span>
            <span className="text-xs font-bold tabular-nums text-slate-300">{progressPct}%</span>
          </div>
          <div className="relative h-2 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} rounded-full`}
            />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-colors duration-500 ${isWarning ? "bg-amber-500/5 border-amber-500/20" : "bg-white/5 border-white/10"}`}>
          <p className="text-xs leading-relaxed text-slate-300 font-medium">
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
