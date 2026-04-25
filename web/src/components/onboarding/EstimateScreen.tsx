import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import {
  BadgeCheck,
  CheckCircle2,
  ListTree,
  SlidersHorizontal,
  ArrowRight,
  Wrench,
  ChevronDown,
  ChevronUp,
  Layers,
  Package,
  Boxes,
  Tag,
  Check,
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
import { ESTIMATE_CHART_COLORS } from "@shared/constants/visualization";
import { estimateFallbackUserMessage } from "@shared/constants/onboarding";

function formatMoney(n: number) {
  return formatCurrency(n);
}

export function EstimateScreen() {
  const navigate = useNavigate();
  const { estimate, estimateError, locationInput, runPhotoToScope, setPhotos } =
    useOnboarding();
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (estimate) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [...ESTIMATE_CHART_COLORS],
      });
    }
  }, [estimate]);

  const summary = estimate?.summary;
  const min = summary?.estimated_min_total ?? DEFAULT_ESTIMATE_MIN;
  const max = summary?.estimated_max_total ?? DEFAULT_ESTIMATE_MAX;
  const conf = summary?.confidence_score ?? DEFAULT_ESTIMATE_CONFIDENCE;
  const area =
    estimate?.area_label ||
    (locationInput.replace(/\D/g, "").length >= 5
      ? `ZIP ${locationInput.replace(/\D/g, "").slice(0, 5)}`
      : "your area");

  const fallbackLine = estimateFallbackUserMessage(
    estimate?.used_fallback,
    estimate?.fallback_reason,
  );

  const bullets = estimate?.scope_items
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
    <PageTransition>
      <div className="space-y-8 py-4">
        <div className="space-y-2 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="inline-flex items-center justify-center p-2 bg-teal-50 rounded-full mb-2"
          >
            <Wrench className="w-5 h-5 text-teal-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold tracking-tight text-slate-900"
          >
            Your BLUPRNT is Ready
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 lg:text-lg"
          >
            Based on current market data for {area}.
          </motion.p>
          {fallbackLine ? (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mx-auto max-w-lg rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950"
              role="status"
            >
              {fallbackLine}
            </motion.p>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            delay: 0.4,
          }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-teal-500/10 blur-2xl rounded-[3rem] -z-10 animate-pulse" />
          <Card className="border-teal-100 shadow-[0_20px_50px_rgba(13,148,136,0.12)] overflow-hidden bg-white/80 backdrop-blur-xl ring-1 ring-white/50">
            <div className="bg-linear-to-b from-teal-50/50 to-transparent p-8 flex flex-col items-center text-center space-y-4">
              <Badge
                variant="secondary"
                className="bg-teal-600 text-white hover:bg-teal-700 h-7 px-3 gap-1.5 shadow-md shadow-teal-200 border-none transition-transform hover:scale-105"
              >
                <BadgeCheck className="w-4 h-4" aria-hidden />
                Confidence: {conf} / 5
              </Badge>

              <div className="space-y-1">
                <p className="text-xs text-teal-600 font-black uppercase tracking-[0.2em]">
                  Investment Range
                </p>
                <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter py-2">
                  <Highlighter
                    color="rgba(13, 148, 136, 0.14)"
                    strokeWidth={12}
                    delay={1}
                  >
                    {formatMoney(min)} – {formatMoney(max)}
                  </Highlighter>
                </div>
              </div>

              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                {estimate?.used_fallback
                  ? "Use this range for planning only—not a substitute for a contractor bid."
                  : "This includes labor, materials, and local permits for a standard project."}
              </p>
            </div>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="h-px bg-slate-100 w-full" />

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-medium text-slate-600">
                      Typical labor near you
                    </span>
                  </div>
                  {estimate?.scope_items && estimate.scope_items.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className={`h-8 px-3 rounded-full gap-2 transition-all duration-300 ${
                        showBreakdown
                          ? "bg-teal-600 text-white hover:bg-teal-700 shadow-md"
                          : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {showBreakdown ? "Hide Breakdown" : "View Breakdown"}
                      </span>
                      {showBreakdown ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  )}
                </div>

                {showBreakdown && estimate?.scope_items && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-6 overflow-hidden"
                  >
                    {/* Cost Breakdown */}
                    <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4 sm:p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-teal-600" />
                        <h4 className="text-[11px] font-black text-teal-700 uppercase tracking-[0.15em]">
                          Cost Breakdown
                        </h4>
                      </div>
                      <div className="divide-y divide-slate-200/60">
                        {estimate.scope_items.map((item, i) => (
                          <div
                            key={i}
                            className="py-4 first:pt-0 last:pb-0 flex justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-900">
                                {item.category}
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                                {item.description}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-slate-900 tracking-tight">
                                {formatMoney(item.total_cost_min || 0)} –{" "}
                                {formatMoney(item.total_cost_max || 0)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bill of Materials */}
                    {estimate.scope_items.some(
                      (s) => s.metadata?.materials?.length,
                    ) && (
                      <div className="rounded-2xl bg-teal-50/30 border border-teal-100/50 p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-teal-600" />
                            <h4 className="text-[11px] font-black text-teal-700 uppercase tracking-[0.15em]">
                              Detailed Bill of Materials
                            </h4>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-white/50 text-[10px] border-teal-200 text-teal-700"
                          >
                            {
                              estimate.scope_items.flatMap(
                                (s) => s.metadata?.materials || [],
                              ).length
                            }{" "}
                            Items
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {estimate.scope_items
                            .flatMap((s) => s.metadata?.materials || [])
                            .map((m, i) => (
                              <div
                                key={i}
                                className="group relative flex flex-col p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all duration-300"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-teal-50 transition-colors">
                                    <Boxes className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-bold text-slate-900 leading-tight">
                                        {m.name}
                                      </p>
                                      {m.estimated_cost && (
                                        <p className="text-sm font-black text-teal-600 shrink-0">
                                          {formatMoney(m.estimated_cost)}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                      {m.brand && (
                                        <div className="flex items-center gap-1">
                                          <Tag className="w-3 h-3 text-teal-500" />
                                          <span className="text-[10px] font-black text-teal-600 uppercase tracking-tight">
                                            {m.brand}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-500">
                                          QTY: {m.quantity} {m.unit || "units"}
                                        </span>
                                      </div>
                                      {m.estimated_cost &&
                                        m.quantity &&
                                        m.quantity > 1 && (
                                          <span className="text-[10px] font-medium text-slate-400 italic">
                                            Total:{" "}
                                            {formatMoney(
                                              m.estimated_cost *
                                                Number(m.quantity),
                                            )}
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {!showBreakdown && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      Analysis Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                      {Array.from(new Set(bullets)).map((item, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2 + i * 0.1 }}
                          key={`${item}-${i}`}
                          className="flex items-center space-x-2 text-sm text-slate-600 font-medium"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                          <span>{item}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            {summary?.value_engineering_tips &&
              summary.value_engineering_tips.length > 0 && (
                <div className="px-8 pb-8 space-y-4">
                  <div className="rounded-2xl bg-teal-50/50 border border-teal-100/50 p-5 space-y-3">
                    <h5 className="text-xs font-black text-teal-700 uppercase tracking-widest flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5" />
                      AI Project Strategy
                    </h5>
                    <ul className="space-y-2">
                      {summary.value_engineering_tips.map((tip, i) => (
                        <li
                          key={i}
                          className="text-sm text-slate-700 leading-snug flex gap-2"
                        >
                          <span className="text-teal-400 font-bold">•</span>
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
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Local Market Intelligence
              </p>
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
            <p>
              {estimate
                ? "This is a predicted baseline. Save to refine details."
                : estimateError}
            </p>
            {!estimate ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void runPhotoToScope({ maxRetries: 2 })}
                >
                  Retry
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void runPhotoToScope({ textOnly: true, maxRetries: 1 })
                  }
                >
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
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              variant="primary"
              className="flex-1 h-14 text-base shadow-lg shadow-teal-500/20 group animate-bounce-subtle"
              onClick={() => {
                try {
                  sessionStorage.setItem(
                    "bluprnt_redirect",
                    "/dashboard/scope",
                  );
                } catch {
                  /* ignore */
                }
                navigate("/onboarding/signup");
              }}
              type="button"
            >
              <ListTree
                className="w-5 h-5 shrink-0 transition-transform group-hover:rotate-6"
                aria-hidden
              />
              Explore detailed line items
              <ArrowRight
                className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="flex-1 h-14 text-base font-bold text-slate-500 hover:text-teal-600 hover:bg-teal-50/50 transition-all border border-slate-100"
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
              <SlidersHorizontal
                className="w-5 h-5 shrink-0 mr-2"
                aria-hidden
              />
              Adjust cost factors
            </Button>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
