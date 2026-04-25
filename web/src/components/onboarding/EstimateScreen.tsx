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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageTransition } from "./PageTransition";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  DEFAULT_ESTIMATE_CONFIDENCE,
  DEFAULT_ESTIMATE_MAX,
  DEFAULT_ESTIMATE_MIN,
} from "@/lib/onboarding-helpers";
import { ESTIMATE_CHART_COLORS } from "@shared/constants/visualization";
import { estimateFallbackUserMessage } from "@shared/constants/onboarding";

// Sub-components
import { EstimateHeader } from "./estimate/EstimateHeader";
import { InvestmentRangeCard } from "./estimate/InvestmentRangeCard";

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

  const handleSignupRedirect = (target: string) => {
    try {
      sessionStorage.setItem("bluprnt_redirect", target);
    } catch {
      /* ignore */
    }
    navigate("/onboarding/signup");
  };

  return (
    <PageTransition>
      <div className="space-y-8 py-4">
        <EstimateHeader area={area} fallbackLine={fallbackLine} />

        <InvestmentRangeCard
          min={min}
          max={max}
          conf={conf}
          summary={summary}
          scopeItems={estimate?.scope_items}
          usedFallback={estimate?.used_fallback}
          showBreakdown={showBreakdown}
          setShowBreakdown={setShowBreakdown}
        />

        {!showBreakdown && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              Analysis Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
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
            {!estimate && (
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
            )}
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
              onClick={() => handleSignupRedirect("/dashboard/scope")}
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
              onClick={() => handleSignupRedirect("/dashboard/plan")}
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
