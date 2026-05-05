import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Upload, FileDown, Share2, ListTree } from "lucide-react";
import {
  clearDashboardWelcomeFlag,
  readDashboardWelcomeFlag,
} from "@/lib/dashboard-welcome";
import { Highlighter } from "@/components/ui/Highlighter";
import { ROUGH_NOTATION } from "@shared/constants/visualization";

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
      className="rounded-2xl border border-slate-200/80 bg-linear-to-r from-slate-50 to-slate-100/80 p-5 sm:p-6 shadow-drop-md transition-shadow duration-300 hover:shadow-drop-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">
            <Highlighter
              action="highlight"
              color={ROUGH_NOTATION.highlightRose}
              padding={2}
              iterations={1}
              isView={true}
              delay={0.6}
            >
              Your estimate is saved
            </Highlighter>
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Here&apos;s what to do next—pick one to get the most from
            BLUPRNT.AI.
          </p>
          <div className="flex w-full max-w-full flex-row items-center justify-between gap-2 pt-2 sm:justify-evenly sm:gap-3">
            <button
              type="button"
              title="Upload project docs"
              aria-label="Upload project docs"
              className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dotted border-teal-700 bg-teal-950 text-white shadow-sm transition-all duration-300 hover:bg-teal-900 hover:border-teal-600 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              onClick={() => {
                dismiss();
                navigate("/dashboard/execute");
              }}
            >
              <Upload
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={2}
                aria-hidden
              />
            </button>
            <button
              type="button"
              title="See line-by-line budget"
              aria-label="See line-by-line budget"
              className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dotted border-slate-300 bg-white text-teal-600 shadow-sm transition-all duration-300 hover:border-teal-400 hover:bg-teal-50/60 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              onClick={() => {
                dismiss();
                navigate("/dashboard/scope");
              }}
            >
              <ListTree
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={2}
                aria-hidden
              />
            </button>
            <button
              type="button"
              title="Export Home Archive"
              aria-label="Export Home Archive"
              className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dotted border-slate-300 bg-white text-teal-600 shadow-sm transition-all duration-300 hover:border-teal-400 hover:bg-teal-50/60 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              onClick={() => {
                dismiss();
                navigate("/dashboard/record");
              }}
            >
              <FileDown
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 pt-1">
            You can also use{" "}
            <Share2
              className="w-3.5 h-3.5 inline align-text-bottom"
              aria-hidden
            />{" "}
            Share to send a read-only view of your estimate.
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
