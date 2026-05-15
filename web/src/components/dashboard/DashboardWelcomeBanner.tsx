import { useState } from "react";
import { X, Upload, FileDown, ListTree } from "lucide-react";
import {
  clearDashboardWelcomeFlag,
  readDashboardWelcomeFlag,
} from "@/lib/dashboard-welcome";

export type DashboardWelcomeBannerAction = "upload" | "scope" | "export";

type Props = {
  hasDocuments?: boolean;
  onAction: (id: DashboardWelcomeBannerAction) => void;
};

export function DashboardWelcomeBanner({
  hasDocuments = false,
  onAction,
}: Props) {
  const [visible, setVisible] = useState(readDashboardWelcomeFlag);

  function dismiss() {
    clearDashboardWelcomeFlag();
    setVisible(false);
  }

  if (!visible) return null;

  const uploadLabel = hasDocuments ? "Add document" : "Upload invoice";

  return (
    <div
      role="region"
      aria-label="Getting started"
      className="rounded-2xl border border-slate-200/80 bg-linear-to-r from-slate-50 to-slate-100/80 p-5 sm:p-6 shadow-drop-md transition-shadow duration-300 hover:shadow-drop-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              {hasDocuments
                ? "Your ledger is active"
                : "Your estimate is saved"}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              {hasDocuments
                ? "Keep adding documents to maximize your home's resale value impact."
                : "Pick a next step to get the most from BLUPRNT.AI."}
            </p>
          </div>

          <div className="flex w-full max-w-full flex-row items-end justify-between gap-2 sm:justify-evenly sm:gap-3">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
              <span className="w-full text-center text-[11px] font-semibold leading-tight tracking-wide text-slate-500">
                {uploadLabel}
              </span>
              <button
                type="button"
                title={uploadLabel}
                aria-label={
                  hasDocuments ? "Add a document" : "Upload an invoice"
                }
                className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-teal-800 bg-teal-950 text-white shadow-sm transition-all duration-300 hover:border-teal-600 hover:bg-teal-900 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                onClick={() => onAction("upload")}
              >
                <Upload
                  className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
              <span className="w-full text-center text-[11px] font-semibold leading-tight tracking-wide text-slate-500">
                View scope
              </span>
              <button
                type="button"
                title="View scope"
                aria-label="See line-by-line scope"
                className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-teal-600 shadow-sm transition-all duration-300 hover:border-teal-400 hover:bg-teal-50/60 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                onClick={() => onAction("scope")}
              >
                <ListTree
                  className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
              <span className="w-full text-center text-[11px] font-semibold leading-tight tracking-wide text-slate-500">
                Export archive
              </span>
              <button
                type="button"
                title="Export archive"
                aria-label="Export home archive"
                className="group inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-teal-600 shadow-sm transition-all duration-300 hover:border-teal-400 hover:bg-teal-50/60 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                onClick={() => onAction("export")}
              >
                <FileDown
                  className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent bg-slate-200/35 text-slate-500 transition-all hover:bg-slate-200/70 hover:text-slate-900 active:scale-95"
          aria-label="Close welcome banner"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
