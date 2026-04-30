import { useId } from "react";
import { motion } from "motion/react";
import {
  BadgeCheck,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/Highlighter";
import { formatCurrency } from "@/lib/i18n";
import type { PhotoToScopeResult } from "@/lib/onboarding-helpers";
import { CostBreakdownTable } from "./CostBreakdownTable";
import { BillOfMaterialsTable } from "./BillOfMaterialsTable";
import { EstimateStrategy } from "./EstimateStrategy";
import type { ScopeMetadata } from "@shared/types/metadata";
import type { BillOfMaterialItem } from "@shared/types/onboarding";

interface InvestmentRangeCardProps {
  min: number;
  max: number;
  conf: number;
  summary?: PhotoToScopeResult["summary"];
  scopeItems?: PhotoToScopeResult["scope_items"];
  usedFallback?: boolean;
  showBreakdown: boolean;
  setShowBreakdown: (show: boolean) => void;
}

export function InvestmentRangeCard({
  min,
  max,
  conf,
  summary,
  scopeItems,
  usedFallback,
  showBreakdown,
  setShowBreakdown,
}: InvestmentRangeCardProps) {
  const disclosureId = useId();
  const breakdownHeadingId = `${disclosureId}-heading`;
  const breakdownPanelId = `${disclosureId}-panel`;

  const materials =
    scopeItems?.flatMap(
      (s) => (s.metadata as ScopeMetadata)?.materials || [],
    ) || [];

  return (
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
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant="secondary"
              className="bg-teal-600 text-white hover:bg-teal-700 h-7 px-3 gap-1.5 shadow-md shadow-teal-200 border-none transition-transform hover:scale-105"
            >
              <BadgeCheck className="w-4 h-4" aria-hidden />
              Confidence: {conf} / 5
            </Badge>

            {summary?.grounding_sources &&
              summary.grounding_sources.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-white/80 text-teal-700 border-teal-200 h-7 px-3 gap-1.5 backdrop-blur-sm shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  Grounded by Google
                </Badge>
              )}
          </div>

          <div className="space-y-1">
            {summary?.regional_signal && (
              <p className="text-[10px] text-teal-700/70 font-black uppercase tracking-[0.15em] bg-teal-50/50 px-2.5 py-1 rounded-full border border-teal-100/30">
                {summary.regional_signal}
              </p>
            )}
            <p
              id={breakdownHeadingId}
              className="text-xs text-teal-600 font-black uppercase tracking-[0.2em]"
            >
              Investment Range
            </p>
            <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter py-2">
              <Highlighter
                color="rgba(13, 148, 136, 0.14)"
                strokeWidth={12}
                delay={1}
              >
                {formatCurrency(min)} – {formatCurrency(max)}
              </Highlighter>
            </div>
          </div>

          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
            {usedFallback
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
                  {summary?.regional_context || "Typical labor near you"}
                </span>
              </div>
              {scopeItems && scopeItems.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  aria-expanded={showBreakdown}
                  aria-controls={breakdownPanelId}
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

            {showBreakdown && scopeItems && (
              <motion.div
                id={breakdownPanelId}
                role="region"
                aria-labelledby={breakdownHeadingId}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="space-y-6 overflow-hidden"
              >
                <CostBreakdownTable items={scopeItems} />
                {materials.length > 0 && (
                  <BillOfMaterialsTable
                    materials={materials as BillOfMaterialItem[]}
                  />
                )}
              </motion.div>
            )}
          </div>
        </CardContent>

        <EstimateStrategy
          tips={summary?.value_engineering_tips}
          sources={summary?.grounding_sources}
        />
      </Card>
    </motion.div>
  );
}
