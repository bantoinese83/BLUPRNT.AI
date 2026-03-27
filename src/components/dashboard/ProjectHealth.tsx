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
  max: number,
): {
  score: number;
  status: string;
  color: string;
  message: string;
  stop1: string;
  stop2: string;
} {
  if (min === 0 || invoiceTotal === 0) {
    return {
      score: 0,
      status: "Analyzing",
      color: "from-slate-400 to-slate-500",
      stop1: "#94a3b8",
      stop2: "#64748b",
      message: "Processing your initial project data...",
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
      message: "Careful! You've exceeded your lifecycle estimate.",
    };
  }

  if (budgetUtilization > 85) {
    return {
      score: 75,
      status: "At Limit",
      color: "from-amber-400 to-orange-500",
      stop1: "#fbbf24",
      stop2: "#f59e0b",
      message: "You're approaching the upper limit of your budget.",
    };
  }

  if (progressPct < 20) {
    return {
      score: 95,
      status: "Excellent",
      color: "from-emerald-400 to-teal-500",
      stop1: "#34d399",
      stop2: "#14b8a6",
      message: "Starting strong! Your initial spending is well-aligned.",
    };
  }

  return {
    score: 88,
    status: "Healthy",
    color: "from-indigo-500 to-blue-600",
    stop1: "#6366f1",
    stop2: "#2563eb",
    message: "Your project spending is pacing well against estimates.",
  };
}

interface CircleProgressProps {
  value: number;
  color: string;
  secondaryColor: string;
  size: number;
  strokeWidth: number;
}

const CircleProgress = ({
  value,
  color,
  secondaryColor,
  size,
  strokeWidth,
}: CircleProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - value) / 100) * circumference;

  const gradientId = "health-gradient";
  const gradientUrl = `url(#${gradientId})`;

  return (
    <div className="relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        aria-label={`Health Progress - ${value}%`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
            <stop
              offset="100%"
              style={{ stopColor: secondaryColor, stopOpacity: 1 }}
            />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gradientUrl}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{
            duration: 1.8,
            ease: "easeInOut",
          }}
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 4px rgba(0,0,0,0.1))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-lg shadow-black/20" />
      </div>
    </div>
  );
};

export function ProjectHealth({
  estimatedMin = 0,
  estimatedMax = 0,
  invoiceTotal = 0,
}: ProjectHealthProps) {
  const min = estimatedMin || 0;
  const max = estimatedMax || 0;
  const { score, status, color, message, stop1, stop2 } = calculateHealthScore(
    invoiceTotal,
    min,
    max,
  );
  return (
    <Card className="overflow-hidden border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-200/30 rounded-[2rem] metal-surface relative">
      <div className="absolute inset-0 noise-overlay opacity-[0.03] pointer-events-none" />
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
          <Highlighter
            action="underline"
            color={stop1}
            strokeWidth={2}
            padding={0}
            isView={true}
            delay={0.6}
          >
            Health Index
          </Highlighter>
          <Shield className="w-3.5 h-3.5 text-slate-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <motion.div
              className="flex items-baseline gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span
                className={`text-6xl font-black tracking-tighter tabular-nums bg-gradient-to-br ${color} bg-clip-text text-transparent`}
              >
                {score}
              </span>
              <span className="text-slate-500 text-lg font-bold">/100</span>
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.div
                className={`px-2 py-0.5 rounded-full bg-gradient-to-br ${color} text-[10px] font-black uppercase tracking-widest text-white`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {status}
              </motion.div>
              {invoiceTotal > 0 && (
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <TrendingUp className="w-3 h-3" />
                  Live
                </div>
              )}
            </div>
          </div>

          <motion.div
            className="relative mb-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <CircleProgress
              value={score}
              color={stop1}
              secondaryColor={stop2}
              size={110}
              strokeWidth={14}
            />
          </motion.div>
        </div>

        <motion.div
          className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start gap-3 group hover:bg-white transition-colors duration-300"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div
            className={`mt-1.5 w-2 h-2 rounded-full bg-gradient-to-br ${color} shrink-0 animate-pulse`}
          />
          <p className="text-sm font-medium text-slate-600 leading-relaxed italic group-hover:text-slate-900 transition-colors">
            "{message}"
          </p>
        </motion.div>

        {invoiceTotal > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 px-1">
              <span>Project Completion</span>
              <span className="text-slate-900">
                {Math.min(
                  100,
                  Math.round((invoiceTotal / (estimatedMin || 1)) * 100),
                )}
                %
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 bg-slate-900 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (invoiceTotal / (estimatedMin || 1)) * 100)}%`,
                }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
              />
            </div>
            <p className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-widest pt-1">
              Based on paid invoices vs. minimum baseline
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
