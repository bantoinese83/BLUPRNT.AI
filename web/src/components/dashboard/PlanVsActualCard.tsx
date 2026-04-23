import { Card, CardContent } from "@/components/ui/card";
import { Scale, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { money } from "@/lib/formatters";
import {
  capitalImprovementTotal,
  planVsActualNarrative,
  type InvoiceLike,
} from "@/lib/plan-vs-actual";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type PlanVsActualCardProps = {
  estimatedMin: number | null;
  estimatedMax: number | null;
  invoices: InvoiceLike[];
};

const toneStyles: Record<
  string,
  { border: string; iconBg: string; accent: string }
> = {
  no_estimate: {
    border: "border-slate-200/80",
    iconBg: "bg-slate-100 text-slate-700",
    accent: "text-slate-600",
  },
  no_documents: {
    border: "border-teal-200/70",
    iconBg: "bg-teal-50 text-teal-700",
    accent: "text-teal-700",
  },
  within: {
    border: "border-emerald-200/80",
    iconBg: "bg-emerald-50 text-emerald-700",
    accent: "text-emerald-800",
  },
  below_min: {
    border: "border-teal-200/80",
    iconBg: "bg-teal-50 text-teal-800",
    accent: "text-teal-900",
  },
  above_max: {
    border: "border-amber-200/90",
    iconBg: "bg-amber-50 text-amber-800",
    accent: "text-amber-900",
  },
};

export function PlanVsActualCard({
  estimatedMin,
  estimatedMax,
  invoices,
}: PlanVsActualCardProps) {
  const navigate = useNavigate();
  const capital = capitalImprovementTotal(invoices);
  const { headline, body, kind } = planVsActualNarrative(
    estimatedMin,
    estimatedMax,
    capital,
  );
  const tone = toneStyles[kind] ?? toneStyles.no_estimate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        className={cn(
          "overflow-hidden rounded-3xl border-2 bg-white/90 shadow-drop-lg backdrop-blur-sm transition-shadow duration-300 hover:shadow-elevated",
          tone.border,
        )}
      >
        <CardContent className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  tone.iconBg,
                )}
              >
                <Scale className="h-6 w-6" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Plan vs Actual Spending
                </p>
                <h3
                  className={cn(
                    "text-lg font-black leading-tight tracking-tight text-slate-900",
                    tone.accent,
                  )}
                >
                  {headline}
                </h3>
                <p className="max-w-prose text-sm font-medium leading-relaxed text-slate-600">
                  {body}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Your estimate
              </p>
              <p className="mt-1 text-lg font-black tabular-nums text-slate-900">
                {money(estimatedMin, estimatedMax)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Project Docs logged
              </p>
              <p className="mt-1 text-lg font-black tabular-nums text-slate-900">
                {money(capital)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2 rounded-xl border-slate-200 sm:w-auto"
              onClick={() => {
                const el = document.getElementById("document-vault-anchor");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  navigate("/dashboard/record");
                }
              }}
            >
              Home Archive includes this story
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-slate-500 hover:text-slate-800 sm:w-auto"
              onClick={() => navigate("/dashboard/record")}
            >
              Open Vault
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
