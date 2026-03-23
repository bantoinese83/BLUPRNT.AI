import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { Highlighter } from "@/components/ui/Highlighter";

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

  if (progressPct < 20) {
    return {
      score: 95,
      status: "Excellent",
      color: "from-emerald-400 to-teal-500",
      stop1: "#34d399",
      stop2: "#14b8a6",
      message: "Starting strong! Your initial spending is well-aligned."
    };
  }

  return {
    score: 88,
    status: "Healthy",
    color: "from-indigo-500 to-blue-600",
    stop1: "#6366f1",
    stop2: "#2563eb",
    message: "Your project spending is pacing well against estimates."
  };
}

export function ProjectHealth({ estimatedMin = 0, estimatedMax = 0, invoiceTotal = 0 }: ProjectHealthProps) {
  const min = estimatedMin || 0;
  const max = estimatedMax || 0;
  const { score, status, color, message, stop1, stop2 } = calculateHealthScore(invoiceTotal, min, max);

  return (
    <Card className="overflow-hidden border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/30 rounded-[2rem]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
          <Highlighter action="underline" color={stop1} strokeWidth={2} padding={0}>
            Health Index
          </Highlighter>
          <Shield className="w-3.5 h-3.5 text-slate-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
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
                animate={{ strokeDashoffset: (2 * Math.PI * 38) * (1 - score / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                strokeLinecap="round"
                style={{ color: stop1 }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={stop1} />
                  <stop offset="100%" stopColor={stop2} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 shadow-lg shadow-black/20" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 group hover:bg-white transition-colors duration-300">
          <div className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-br ${color} shrink-0 animate-pulse`} />
          <p className="text-sm font-medium text-slate-600 leading-relaxed italic group-hover:text-slate-900 transition-colors">
            "{message}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
