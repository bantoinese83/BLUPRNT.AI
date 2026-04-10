import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ListTree,
  Hammer,
  ChevronDown,
  ChevronUp,
  Package,
  Tag,
  Boxes,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import type { ProjectRow, ScopeRow } from "@shared/types/database";

import { money, getStars as stars } from "@/lib/formatters";
import { InsightTeaser } from "./InsightTeaser";

function MaterialDetailList({
  materials,
}: {
  materials: NonNullable<ScopeRow["metadata"]>["materials"];
}) {
  if (!materials || materials.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-teal-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Detailed Bill of Materials
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {materials.map((m, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-teal-100 group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-teal-50 transition-colors">
              <Boxes className="w-4 h-4 text-slate-400 group-hover:text-teal-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-slate-900 leading-tight">
                {m.name}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                {m.brand && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    {m.brand}
                  </span>
                )}
                {m.quantity && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded leading-none">
                    {m.quantity} {m.unit || "units"}
                  </span>
                )}
              </div>
              {m.model && (
                <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">
                  Model: {m.model}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 flex items-center justify-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          Quantities grounded in regional waste factors
        </p>
      </div>
    </div>
  );
}

export function EstimateSummary({
  project,
  scopeItems,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
}: {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
}) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const conf = project.confidence_score ?? 4.5;
  const regionalSignal = project.metadata?.regional_signal;

  const isEmpty = scopeItems.length === 0;

  return (
    <Card className="overflow-hidden border-slate-200/60 shadow-md shadow-slate-100/20 rounded-3xl">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        {/* Abstract background highlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-slate-400 text-[11px] font-extrabold uppercase tracking-[0.2em] flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden />
              Projected Investment
            </p>
            {regionalSignal && (
              <Badge className="bg-teal-500/20 text-teal-300 border-none text-[9px] font-black uppercase tracking-widest py-0.5 px-2">
                {regionalSignal}
              </Badge>
            )}
          </div>

          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums text-white">
            {money(project.estimated_min_total, project.estimated_max_total)}
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Full renovation lifecycle estimate
          </p>

          {!isArchitect && !hasProjectPass && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 pt-6 border-t border-slate-700/50"
            >
              <button
                onClick={onUpgradeClick}
                className="group flex items-center gap-3 text-left hover:bg-slate-800/50 p-3 rounded-2xl transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Hammer className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none mb-1">
                    Unlock Expert AI Strategies
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Get maintenance tips, phases & regional context.
                  </p>
                </div>
              </button>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 relative z-10">
          <Badge
            className="bg-slate-800 text-slate-300 border-slate-700 font-bold px-3 py-1 rounded-lg"
            title="How well our estimate matches similar projects in your area"
          >
            {conf * 20}% Confidence
          </Badge>

          <div className="flex flex-col md:items-end">
            <div className="flex gap-0.5 mb-1.5">{stars(conf)}</div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-shadow-sm">
              Regional Match
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-0 bg-white">
        {isEmpty ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
              <ListTree
                className="w-10 h-10 text-slate-300"
                strokeWidth={1.5}
              />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">
              No line items yet
            </h4>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              We&apos;re still gathering the full scope for your{" "}
              <span className="font-semibold text-slate-700">
                {project.name}
              </span>
              . Run the smart estimate to see detailed category costs.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="gap-2.5 rounded-2xl px-8 shadow-lg shadow-slate-100"
              onClick={() => navigate("/dashboard/scope")}
            >
              <ListTree className="w-5 h-5 shrink-0" aria-hidden />
              Open project scope
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {scopeItems.slice(0, 10).map((item) => {
              const isExpanded = expandedId === item.id;
              const materials = item.metadata?.materials;
              const hasMaterials = materials && materials.length > 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group p-5 sm:p-7 flex flex-col hover:bg-slate-50/30 transition-all duration-300 border-l-4 border-l-transparent",
                    isExpanded &&
                      "bg-slate-50/50 border-l-teal-500 shadow-inner",
                  )}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2.5">
                        <h4 className="font-bold text-slate-900 tracking-tight group-hover:text-slate-950 transition-colors uppercase">
                          {item.category}
                        </h4>

                        {item.finish_tier && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100/80 text-slate-600 border-none px-2 py-0.5"
                          >
                            {item.finish_tier}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {stars(item.confidence_score)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Market Precision
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end shrink-0 gap-3">
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-lg text-slate-900 tabular-nums mb-0.5">
                          {money(item.total_cost_min, item.total_cost_max)}
                        </div>
                        {item.quantity != null && item.unit && (
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded inline-block">
                            {item.quantity} {item.unit}
                          </div>
                        )}
                      </div>

                      {hasMaterials && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className={cn(
                            "h-8 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all",
                            isExpanded
                              ? "bg-slate-900 text-white hover:bg-black"
                              : "bg-white text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50",
                          )}
                        >
                          {isExpanded ? "Hide Details" : "View Breakdown"}
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 ml-1.5" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-1.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <MaterialDetailList materials={materials} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {scopeItems.length > 10 && (
              <div className="p-6 bg-slate-50/50 flex justify-center border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-900 font-bold tracking-tight hover:bg-slate-100"
                  onClick={() => navigate("/dashboard/scope")}
                >
                  View {scopeItems.length - 10} more line items
                  <ListTree className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
            {!isArchitect && !hasProjectPass && onUpgradeClick && (
              <InsightTeaser
                onUpgradeClick={onUpgradeClick}
                projectName={project.name}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
