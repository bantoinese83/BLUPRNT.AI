import { useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  TrendingUp,
  Activity,
  FileText,
  Layers,
  Receipt,
} from "lucide-react";
import { motion } from "motion/react";
import { Highlighter } from "@/components/ui/Highlighter";
import { calculateHealthScore } from "@shared/lib/project-health";
import { money } from "@/lib/formatters";
import type { LucideIcon } from "lucide-react";

type ProjectHealthProps = {
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  spendingTotal?: number;
  /** Ledger rows (documents) in the project */
  documentCount?: number;
  /** Scope line items */
  scopeLineCount?: number;
  /** Billed amount not yet linked to scope (from reconciliation) */
  unreconciledBilled?: number;
};

interface CircleProgressProps {
  value: number;
  color: string;
  secondaryColor: string;
  size: number;
  strokeWidth: number;
  /** Unique SVG defs id (multiple Health cards / strict mode need distinct ids). */
  gradientId: string;
}

const CIRCLE_CONFIG = {
  /** Fits narrow dashboard sidebar without clipping the ring. */
  SIZE: 92,
  STROKE_WIDTH: 11,
  ANIMATION_DURATION: 1.8,
} as const;

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100/90 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-sm">
      <Icon
        className="mb-1 h-3.5 w-3.5 text-teal-600"
        aria-hidden
        strokeWidth={2.25}
      />
      <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className="truncate text-sm font-black tabular-nums text-slate-900">
        {value}
      </div>
    </div>
  );
}

function SpendRunwayBar({
  min,
  max,
  spend,
}: {
  min: number;
  max: number;
  spend: number;
}) {
  const scale = Math.max(min, max, spend) * 1.08 || 1;
  const loPct = Math.min(100, (min / scale) * 100);
  const hiPct = Math.min(100, (max / scale) * 100);
  const spendPctRaw = (spend / scale) * 100;
  const spendPct = Math.min(100, Math.max(0, spendPctRaw));
  const bandLeft = Math.min(loPct, hiPct);
  const bandWidth = Math.max(hiPct - loPct, 0.8);
  const overHigh = spend > max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Spend vs estimate band
        </p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-100/60">
          <span className="text-[9px] font-black uppercase tracking-wider text-teal-700">
            Current Spend:
          </span>
          <span
            className={`text-xs font-black tabular-nums ${overHigh ? "text-rose-600" : "text-teal-900"}`}
          >
            {money(spend)}
          </span>
        </div>
      </div>
      <div className="relative h-10 py-0.5">
        <div className="absolute inset-x-0 top-1/2 h-7 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-100/60">
          <div
            className="absolute inset-y-0 bg-teal-100/80 border-x-2 border-teal-500/50"
            style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 z-10 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 flex items-center justify-center shadow-md border border-slate-100"
          style={{ left: `${spendPct}%` }}
        >
          <div
            className="w-3 h-3 rounded-full shadow-xs"
            style={{
              backgroundColor: overHigh ? "rgb(244 63 94)" : "rgb(13 148 136)",
            }}
            aria-hidden
          />
        </div>
        {overHigh ? (
          <span className="pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2 text-[8px] font-black uppercase tracking-tighter text-rose-600">
            Over
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
        <span className="min-w-0 truncate">Low {money(min)}</span>
        <span className="min-w-0 truncate text-right">High {money(max)}</span>
      </div>
    </div>
  );
}

const CircleProgress = ({
  value,
  color,
  secondaryColor,
  size,
  strokeWidth,
  gradientId,
}: CircleProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - value) / 100) * circumference;

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
          className="text-slate-200"
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
            duration: CIRCLE_CONFIG.ANIMATION_DURATION,
            ease: "easeInOut",
          }}
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 4px rgba(0,0,0,0.1))",
          }}
        />
      </svg>
    </div>
  );
};

export function ProjectHealth({
  estimatedMin = 0,
  estimatedMax = 0,
  spendingTotal = 0,
  documentCount = 0,
  scopeLineCount = 0,
  unreconciledBilled = 0,
}: ProjectHealthProps) {
  const min = estimatedMin || 0;
  const max = estimatedMax || 0;
  const {
    score,
    status,
    message,
    stop1,
    stop2,
    pctOfEstimateLow,
    pctOfEstimateHigh,
    dollarsOverHighEstimate,
  } = calculateHealthScore(spendingTotal, min, max);

  const colorMap: Record<string, string> = {
    Analyzing: "from-slate-400 to-slate-500",
    "Over Budget": "from-rose-500 to-orange-600",
    "At Limit": "from-amber-400 to-orange-500",
    Excellent: "from-emerald-400 to-teal-500",
    Healthy: "from-teal-500 to-emerald-600",
  };
  const color = colorMap[status] || "from-teal-500 to-emerald-600";
  const showRunway = min > 0 && max > 0;
  const pctHighRounded = Math.round(pctOfEstimateHigh);
  const pctLowRounded = Math.round(pctOfEstimateLow);
  const ringGradientId = useId().replace(/:/g, "");

  return (
    <Card className="relative min-w-0 overflow-hidden rounded-4xl border-slate-200/60 bg-white/70 shadow-xl shadow-slate-200/30 backdrop-blur-xl metal-surface">
      <div className="pointer-events-none absolute inset-0 noise-overlay opacity-[0.03]" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
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
          <Shield className="h-3.5 w-3.5 text-slate-400" aria-hidden />
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 space-y-5 pt-2">
        {/* Score + ring on one row so narrow sidebars never squeeze three parallel columns */}
        <div className="flex min-w-0 flex-row items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <motion.div
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span
                className={`bg-linear-to-br ${color} bg-clip-text text-5xl font-black tracking-tighter text-transparent tabular-nums sm:text-6xl`}
              >
                {score}
              </span>
              <span className="text-base font-bold text-slate-500 sm:text-lg">
                /100
              </span>
            </motion.div>
            <div className="flex flex-wrap items-center gap-2">
              <motion.div
                className={`rounded-full bg-linear-to-br ${color} px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {status}
              </motion.div>
              {spendingTotal > 0 && (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                  <TrendingUp className="h-3 w-3" aria-hidden />
                  Live
                </div>
              )}
            </div>
          </div>

          <motion.div
            className="relative shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <CircleProgress
              value={score}
              color={stop1}
              secondaryColor={stop2}
              size={CIRCLE_CONFIG.SIZE}
              strokeWidth={CIRCLE_CONFIG.STROKE_WIDTH}
              gradientId={ringGradientId}
            />
          </motion.div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div
            className={`grid min-w-0 gap-2 ${
              unreconciledBilled > 0
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            <MetricTile
              icon={FileText}
              label="Documents"
              value={documentCount > 0 ? String(documentCount) : "—"}
            />
            <MetricTile
              icon={Layers}
              label="Scope lines"
              value={scopeLineCount > 0 ? String(scopeLineCount) : "—"}
            />
            <MetricTile
              icon={Activity}
              label="Vs estimate high"
              value={max > 0 && spendingTotal > 0 ? `${pctHighRounded}%` : "—"}
            />
            {unreconciledBilled > 0 ? (
              <MetricTile
                icon={Receipt}
                label="Unlinked"
                value={money(unreconciledBilled)}
              />
            ) : null}
          </div>

          {showRunway && spendingTotal > 0 ? (
            <SpendRunwayBar min={min} max={max} spend={spendingTotal} />
          ) : showRunway && status === "Analyzing" ? (
            <p className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/60 px-4 py-3 text-left text-xs font-medium leading-snug text-slate-500 sm:text-center">
              Upload documents to compare spend with your estimate range.
            </p>
          ) : null}

          {dollarsOverHighEstimate > 0 && (
            <p className="wrap-break-word text-left text-[11px] font-bold uppercase leading-snug tracking-wide text-rose-600 sm:text-center">
              {money(dollarsOverHighEstimate)} above high estimate ·{" "}
              {pctLowRounded}% of low estimate
            </p>
          )}
        </div>

        <motion.div
          className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-colors duration-300 hover:bg-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Activity
            className="mt-1.5 h-3 w-3 shrink-0 text-slate-500 opacity-50"
            aria-hidden
          />
          <p className="text-sm font-medium leading-relaxed text-slate-600 italic group-hover:text-slate-900 transition-colors">
            {`"${message}"`}
          </p>
        </motion.div>

        {spendingTotal > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
              <span>Project Completion</span>
              <span className="text-slate-900">
                {Math.min(
                  100,
                  Math.round((spendingTotal / (estimatedMin || 1)) * 100),
                )}
                %
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-teal-600"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, (spendingTotal / (estimatedMin || 1)) * 100)}%`,
                }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
              />
            </div>
            <p className="pt-1 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Based on documented spending vs. the low end of your estimate
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
