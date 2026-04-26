import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Info } from "lucide-react";
import { motion } from "motion/react";
import { BLUPRNT_COLORS } from "@shared/constants/design-tokens";
import type { ResaleImpactResult } from "@shared/lib/resale-value";

export function ResaleValueImpact({
  investment,
  resaleImpact,
  projectName,
}: {
  investment: number;
  resaleImpact: ResaleImpactResult;
  projectName: string;
}) {
  const { totalImpact, ledgerPremium } = resaleImpact;

  return (
    <Card className="overflow-hidden border-slate-100 shadow-xl shadow-slate-50/50 group">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-900" />
            Resale Value Impact
          </div>
          {investment > 0 && (
            <Badge
              variant="secondary"
              className="bg-teal-950 text-emerald-400 border-teal-900 gap-1.5 text-[9px] font-black uppercase tracking-widest hover:bg-teal-900 transition-colors"
            >
              Vault Premium Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-2">
          <motion.h3
            key={totalImpact}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl font-black text-slate-900"
          >
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(totalImpact)}
          </motion.h3>
          <span className="text-sm font-bold text-slate-400">
            Est. Added Value
          </span>
        </div>

        {ledgerPremium > 0 && (
          <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-teal-900 uppercase tracking-widest">
                Vault Premium
              </p>
              <p className="text-xs text-teal-600 font-medium">
                Earned through verification
              </p>
            </div>
            <div className="text-teal-900 font-black text-sm">
              +
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(ledgerPremium)}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="relative h-24">
            <svg
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="growthGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="100%" stopColor={BLUPRNT_COLORS.primary} />
                </linearGradient>
              </defs>
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                d="M0 80 Q 50 70, 100 60 T 200 40 T 300 10"
                fill="none"
                stroke="url(#growthGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                className="w-full"
              />
              <motion.circle
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                cx="300"
                cy="10"
                r="6"
                fill={BLUPRNT_COLORS.primary}
                className="drop-shadow-[0_0_8px_rgba(19,78,74,0.45)]"
              />
            </svg>
          </div>
          <div className="flex justify-end">
            <div className="rounded-lg bg-teal-950 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-teal-400" />
              Peak ROI
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 mt-0.5" />
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Illustrative example only—not an appraisal, guarantee, or financial
            advice. Based on rough inputs for{" "}
            <span className="text-slate-900 font-bold">{projectName}</span>.
            Well-documented improvements can be easier for buyers and appraisers
            to understand; actual value depends on many factors.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
