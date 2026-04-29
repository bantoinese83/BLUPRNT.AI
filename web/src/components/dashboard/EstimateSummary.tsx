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
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardEmptyPanel } from "@/components/ui/dashboard-empty-panel";

import type { ProjectRow, ScopeRow } from "@shared/types/database";
import type { ReconciliationResult } from "@shared/lib/reconciliation";
import {
  RECONCILIATION_STATUS_LABELS,
  CONFIDENCE_LABELS,
  DASHBOARD_STATS_LABELS,
} from "@shared/copy/dashboard";

import { money, getStars as stars } from "@/lib/formatters";
import { InsightTeaser } from "./InsightTeaser";
import { BillOfMaterialsList } from "./scope-item/BillOfMaterialsList";
import { ReconciledDocumentsList } from "./scope-item/ReconciledDocumentsList";
import type { LedgerEntryWithLines } from "@shared/types/database";

export function EstimateSummary({
  project,
  scopeItems,
  ledgerEntries,
  reconciliation,
  isArchitect,
  hasProjectPass,
  onUpgradeClick,
}: {
  project: ProjectRow;
  scopeItems: ScopeRow[];
  ledgerEntries: LedgerEntryWithLines[];
  reconciliation: ReconciliationResult | null;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  onUpgradeClick?: () => void;
}) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const conf = project.confidence_score ?? 4.5;
  const regionalSignal = (project.metadata as Record<string, unknown>)
    ?.regional_signal as string | undefined;

  const isEmpty = scopeItems.length === 0;

  return (
    <Card className="overflow-hidden border-slate-200/60 shadow-md shadow-slate-100/20 rounded-3xl">
      <div className="bg-linear-to-br from-teal-950 via-teal-900 to-teal-950 text-white p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        {/* Abstract background highlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

        <div className="space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-teal-200/70 text-[11px] font-extrabold uppercase tracking-[0.2em] flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden />
              {DASHBOARD_STATS_LABELS.projectedInvestment}
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
          <p className="text-teal-100/60 text-sm font-medium">
            Full renovation lifecycle estimate
          </p>

          {!isArchitect && !hasProjectPass && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 pt-6 border-t border-teal-800/50"
            >
              <button
                onClick={onUpgradeClick}
                className="group flex items-center gap-3 text-left hover:bg-teal-900/50 p-3 rounded-2xl transition-all"
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
            className="bg-teal-950/90 text-teal-100 border-teal-800 font-bold px-3 py-1 rounded-lg"
            title="How well our estimate matches similar projects in your area"
          >
            {conf * 20}% Confidence
          </Badge>

          <div className="flex flex-col md:items-end">
            <div className="flex gap-0.5 mb-1.5">{stars(conf)}</div>
            <p className="text-[11px] font-bold text-teal-200/60 uppercase tracking-widest text-shadow-sm">
              Regional{" "}
              {RECONCILIATION_STATUS_LABELS.reconciled === "Matched"
                ? "Match"
                : "Score"}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="p-0 bg-white">
        {isEmpty ? (
          <DashboardEmptyPanel
            density="comfortable"
            icon={ListTree}
            title="No line items yet"
            description={
              <>
                We&apos;re still gathering the full scope for your{" "}
                <span className="font-semibold text-slate-700">
                  {project.name}
                </span>
                . Run the smart estimate to see detailed category costs.
              </>
            }
            action={
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
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {scopeItems.slice(0, 10).map((item) => {
              const isExpanded = expandedId === item.id;
              const materials = item.metadata?.materials;
              const hasMaterials = materials && materials.length > 0;
              const recon = reconciliation?.items[item.id];
              const hasRecon = recon && recon.total_billed > 0;
              const hasDetails = hasMaterials || hasRecon;

              const justification =
                item.justification || item.metadata?.justification;
              const careTips =
                item.maintenance_tips || item.metadata?.care_tips;

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
                        <h4 className="font-bold text-teal-950 tracking-tight group-hover:text-teal-800 transition-colors uppercase">
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

                        {hasRecon && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-black uppercase tracking-tighter border-none px-2 py-0.5",
                              recon.status === "reconciled"
                                ? "bg-teal-950 text-emerald-400"
                                : recon.status === "over"
                                  ? "bg-rose-950 text-rose-300"
                                  : "bg-amber-950 text-amber-300",
                            )}
                          >
                            {
                              RECONCILIATION_STATUS_LABELS[
                                recon.status as keyof typeof RECONCILIATION_STATUS_LABELS
                              ]
                            }
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>

                      {(isArchitect || hasProjectPass) && justification && (
                        <p className="text-xs text-slate-400 flex items-start gap-1.5 italic">
                          <Hammer className="w-3.5 h-3.5 mt-0.5 shrink-0 text-teal-400" />
                          <span>{justification}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {stars(item.confidence_score)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {CONFIDENCE_LABELS.marketPrecision}
                        </span>
                      </div>

                      {hasDetails &&
                        (isArchitect || hasProjectPass) &&
                        careTips && (
                          <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold text-teal-600/70 uppercase tracking-tight">
                            <div className="h-1 w-1 rounded-full bg-teal-300" />
                            Care Tip: {careTips}
                          </div>
                        )}
                    </div>
                    <div className="flex flex-col items-start sm:items-end shrink-0 gap-3">
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-lg text-teal-950 tabular-nums mb-0.5">
                          {money(item.total_cost_min, item.total_cost_max)}
                        </div>
                        {hasRecon && (
                          <div
                            className={cn(
                              "flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-tight",
                              recon.status === "reconciled"
                                ? "text-emerald-600"
                                : recon.status === "over"
                                  ? "text-rose-600"
                                  : "text-amber-600",
                            )}
                          >
                            {recon.status === "reconciled" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : recon.status === "over" ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Info className="w-3 h-3" />
                            )}
                            Billed {money(recon.total_billed)}
                          </div>
                        )}
                        {item.quantity != null && item.unit && (
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded inline-block">
                            {item.quantity} {item.unit}
                          </div>
                        )}
                      </div>

                      {hasDetails && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className={cn(
                            "h-8 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all",
                            isExpanded
                              ? "bg-teal-600 text-white hover:bg-teal-500"
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
                        {hasMaterials && (
                          <BillOfMaterialsList materials={materials} />
                        )}
                        {hasRecon && (
                          <ReconciledDocumentsList
                            scopeItemId={item.id}
                            ledgerEntries={ledgerEntries}
                          />
                        )}
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
                  className="text-teal-900 font-bold tracking-tight hover:bg-teal-50"
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
