import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Upload, FileDown, Share2, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearDashboardWelcomeFlag, readDashboardWelcomeFlag } from "@/lib/dashboard-welcome";
import { Highlighter } from "@/components/ui/Highlighter";

export function DashboardWelcomeBanner() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(readDashboardWelcomeFlag);

  function dismiss() {
    clearDashboardWelcomeFlag();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Getting started"
      className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-slate-100/80 p-5 sm:p-6 shadow-sm"
    >

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 min-w-0">
          <h2 className="text-lg font-bold text-slate-900">
            <Highlighter action="highlight" color="#ffd1dc" padding={2} iterations={1}>
              Your estimate is saved
            </Highlighter>
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Here&apos;s what to do next—pick one to get the most from BlueprintAI.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="primary"
              className="gap-2 rounded-xl"
              onClick={() => {
                dismiss();
                navigate("/dashboard/execute");
              }}
            >
              <Upload className="w-4 h-4 shrink-0" aria-hidden />
              Upload an invoice
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 bg-white"
              onClick={() => {
                dismiss();
                navigate("/dashboard/scope");
              }}
            >
              <ListTree className="w-4 h-4 shrink-0" aria-hidden />
              See line-by-line scope
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2 rounded-xl border-slate-200 bg-white"
              onClick={() => {
                dismiss();
                navigate("/dashboard/record");
              }}
            >
              <FileDown className="w-4 h-4 shrink-0" aria-hidden />
              Export seller packet
            </Button>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            You can also use <Share2 className="w-3.5 h-3.5 inline align-text-bottom" aria-hidden /> Share to send a read-only view of your estimate.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-2 rounded-xl text-slate-500 hover:bg-white/80 hover:text-slate-800 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
