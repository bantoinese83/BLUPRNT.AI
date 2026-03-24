import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  BadgeCheck,
  CheckCircle2,
  ListTree,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Highlighter } from "@/components/ui/Highlighter";
import {
  DEFAULT_ESTIMATE_CONFIDENCE,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_MIN,
} from "@/lib/onboarding-helpers";
import { formatCurrency } from "@/lib/i18n";

function formatMoney(n: number) {
  return formatCurrency(n);
}

export function EstimateScreen() {
  const navigate = useNavigate();
  const { estimate, estimateError, locationInput, runPhotoToScope, setPhotos } = useOnboarding();

  const summary = estimate?.summary;
  const min = summary?.estimated_min_total ?? DEFAULT_ESTIMATE_MIN;
  const max = summary?.estimated_max_total ?? DEFAULT_ESTIMATE_MAX;
  const conf = summary?.confidence_score ?? DEFAULT_ESTIMATE_CONFIDENCE;
  const area =
    estimate?.area_label ||
    (locationInput.replace(/\D/g, "").length >= 5
      ? `ZIP ${locationInput.replace(/\D/g, "").slice(0, 5)}`
      : "your area");

  const bullets =
    estimate?.scope_items
      ?.map((s) => s.category)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 8) ?? [
      "Precision Demolition",
      "Premium Cabinetry",
      "Designer Surfaces",
      "Custom Flooring",
      "Integrated Lighting",
      "Plumbing Systems",
    ];

  return (
    <PageTransition duration={0.5}>
      <div className="space-y-8 py-4">
        <div className="space-y-2 text-center">
            <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                className="inline-flex items-center justify-center p-2 bg-indigo-50 rounded-full mb-2"
            >
                <Sparkles className="w-5 h-5 text-indigo-600" />
            </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold tracking-tight text-slate-900"
          >
            Your Blueprint is Ready
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500"
          >
            Based on current market data for {area}.
          </motion.p>
        </div>

        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.4 }}
            className="relative"
        >
            <div className="absolute -inset-4 bg-indigo-500/10 blur-2xl rounded-[3rem] -z-10 animate-pulse" />
            <Card className="border-indigo-100 shadow-[0_20px_50px_rgba(79,70,229,0.1)] overflow-hidden bg-white/80 backdrop-blur-xl ring-1 ring-white/50">
            <div className="bg-gradient-to-b from-indigo-50/50 to-transparent p-8 flex flex-col items-center text-center space-y-4">
                <Badge
                variant="secondary"
                className="bg-indigo-600 text-white hover:bg-indigo-700 h-7 px-3 gap-1.5 shadow-md shadow-indigo-200 border-none transition-transform hover:scale-105"
                >
                <BadgeCheck className="w-4 h-4" aria-hidden />
                Confidence: {conf} / 5
                </Badge>

                <div className="space-y-1">
                    <p className="text-xs text-indigo-600 font-black uppercase tracking-[0.2em]">Investment Range</p>
                    <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter py-2">
                        <Highlighter color="rgba(99, 102, 241, 0.15)" strokeWidth={12} delay={1}>
                            {formatMoney(min)} – {formatMoney(max)}
                        </Highlighter>
                    </div>
                </div>
                
                <p className="text-sm text-slate-500 max-w-[240px] leading-relaxed">
                    This includes labor, materials, and local permits for a standard project.
                </p>
            </div>
            <CardContent className="p-8 pt-0 space-y-6">
                <div className="h-px bg-slate-100 w-full" />
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                        Analysis Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        {Array.from(new Set(bullets)).map((item, i) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.2 + (i * 0.1) }}
                                key={`${item}-${i}`}
                                className="flex items-center space-x-2 text-sm text-slate-600 font-medium"
                            >
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                <span>{item}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </CardContent>

            {summary?.value_engineering_tips && summary.value_engineering_tips.length > 0 && (
                <div className="px-8 pb-8 space-y-4">
                    <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100/50 p-5 space-y-3">
                        <h5 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Project Strategy
                        </h5>
                        <ul className="space-y-2">
                            {summary.value_engineering_tips.map((tip, i) => (
                                <li key={i} className="text-sm text-slate-700 leading-snug flex gap-2">
                                    <span className="text-indigo-400 font-bold">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            </Card>
        </motion.div>

        {summary?.regional_context && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
            >
                <div className="mt-0.5 p-1 bg-white rounded-md shadow-sm border border-slate-200">
                    <BadgeCheck className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Local Market Intelligence</p>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{summary.regional_context}"
                    </p>
                </div>
            </motion.div>
        )}

        {estimateError && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-center text-amber-700 bg-amber-50/70 rounded-lg p-4 border border-amber-100/80 space-y-3"
            >
                <p>{estimate ? "This is a predicted baseline. Save to refine details." : estimateError}</p>
                {!estimate ? (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => void runPhotoToScope({ maxRetries: 2 })}>
                      Retry
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void runPhotoToScope({ textOnly: true, maxRetries: 1 })}>
                      Use text only
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setPhotos([]);
                        void runPhotoToScope({ textOnly: true, maxRetries: 1 });
                      }}
                    >
                      Skip photos
                    </Button>
                  </div>
                ) : null}
            </motion.div>
        )}

        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="space-y-4 pt-4"
        >
          <Button
            size="lg"
            variant="primary"
            className="w-full h-14 text-base shadow-lg shadow-indigo-500/20 group animate-bounce-subtle"
            onClick={() => {
              try {
                sessionStorage.setItem("bluprnt_redirect", "/dashboard/scope");
              } catch {
                /* ignore */
              }
              navigate("/onboarding/signup");
            }}
            type="button"
          >
            <ListTree className="w-5 h-5 shrink-0 transition-transform group-hover:rotate-6" aria-hidden />
            Explore detailed line items
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" aria-hidden />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full h-14 text-base font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
            onClick={() => {
              try {
                sessionStorage.setItem("bluprnt_redirect", "/dashboard/plan");
              } catch {
                /* ignore */
              }
              navigate("/onboarding/signup");
            }}
            type="button"
          >
            <SlidersHorizontal className="w-5 h-5 shrink-0 mr-2" aria-hidden />
            Adjust cost factors
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
}

