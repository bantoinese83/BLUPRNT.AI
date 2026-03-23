import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, Hammer, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const TAB_CONFIG = {
  "/dashboard/plan": {
    icon: ClipboardList,
    title: "Plan your budget",
    why: "See your estimated range and every line item so you know what the remodel should cost.",
    cta: "View full scope",
    path: "/dashboard/scope",
    variant: "outline" as const,
  },
  "/dashboard/execute": {
    icon: Hammer,
    title: "Track real spending",
    why: "Upload invoices and quotes so you can compare actual costs to your estimate.",
    cta: "Upload a document",
    path: "/dashboard/execute",
    variant: "primary" as const,
    scrollToUpload: true,
  },
  "/dashboard/record": {
    icon: FileText,
    title: "Build your resale record",
    why: "Export a clean PDF of improvements and costs for buyers, agents, or your files.",
    cta: "Export PDF",
    path: "/dashboard/record",
    variant: "primary" as const,
    scrollToLedger: true,
  },
};

export function DashboardTabIntro() {
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.replace(/\/$/, "").split("/").slice(0, 3).join("/") || "/dashboard/plan";
  const key =
    base === "/dashboard/plan" || base === "/dashboard"
      ? "/dashboard/plan"
      : base === "/dashboard/execute"
        ? "/dashboard/execute"
        : base === "/dashboard/record"
          ? "/dashboard/record"
          : null;

  if (!key || !TAB_CONFIG[key as keyof typeof TAB_CONFIG]) return null;
  const cfg = TAB_CONFIG[key as keyof typeof TAB_CONFIG];
  const Icon = cfg.icon;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-sm p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-4 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="font-semibold text-slate-900">{cfg.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">{cfg.why}</p>
          </div>
        </div>
        <Button
          type="button"
          variant={cfg.variant}
          className="shrink-0 gap-2 rounded-xl w-full sm:w-auto"
          onClick={() => {
            if ("scrollToUpload" in cfg && cfg.scrollToUpload) {
              document.getElementById("invoice-upload-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
            if ("scrollToLedger" in cfg && cfg.scrollToLedger) {
              document.getElementById("property-ledger-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
              return;
            }
            navigate(cfg.path);
          }}
        >
          {cfg.cta}
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
