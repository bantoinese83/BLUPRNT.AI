import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Info } from "lucide-react";
import { motion } from "motion/react";

export function ResaleValueImpact({
  investment,
  projectName,
}: {
  investment: number;
  projectName: string;
}) {
  const valueAddScale = 1.25; // Professional estimate: 1.25x ROI on quality renovations
  const estimatedValueAdd = investment * valueAddScale;

  return (
    <Card className="overflow-hidden border-indigo-100 shadow-xl shadow-indigo-50/50 group">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Resale Value Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-2">
          <h3 className="text-4xl font-black text-indigo-600">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(estimatedValueAdd)}
          </h3>
          <span className="text-sm font-bold text-slate-400">Est. Added Value</span>
        </div>

        <div className="relative h-24 mt-4">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="growthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="100%" stopColor="#4f46e5" />
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
              fill="#4f46e5"
              className="drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]"
            />
          </svg>
          <div className="absolute top-0 right-0 py-1 px-2 rounded-lg bg-indigo-50 text-[10px] font-black text-indigo-600 uppercase tracking-wider animate-pulse">
            Peak ROI
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 mt-0.5" />
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Based on current renovation data for <span className="text-slate-900 font-bold">{projectName}</span>. 
            Quality finishes and professional documentation (like your Property Ledger) typically yield 
            higher appraisal values.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
