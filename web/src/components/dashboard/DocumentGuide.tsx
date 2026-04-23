import { Hammer, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentGuideProps {
  expanded: boolean;
  setExpanded: (e: boolean) => void;
  onUploadClick: () => void;
  onDismiss: () => void;
  disabled?: boolean;
}

export function DocumentGuide({
  expanded,
  setExpanded,
  onUploadClick,
  onDismiss,
  disabled,
}: DocumentGuideProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left font-semibold text-slate-950 gap-2"
      >
        <span className="flex items-center gap-2">
          <Hammer className="w-5 h-5 opacity-70 shrink-0" aria-hidden />
          First upload? Quick guide
        </span>
        {expanded ? (
          <ChevronUp className="w-5 h-5 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0" />
        )}
      </button>

      {expanded && (
        <>
          <ol className="text-sm text-slate-900/90 space-y-2 list-decimal list-inside pl-1">
            <li>
              <strong>Upload</strong> a PDF or photo—we detect whether it&apos;s
              an invoice (including store receipts), quote, warranty, or permit.
            </li>
            <li>
              <strong>Review</strong> the next screen to line items up with your
              estimate when it&apos;s a bill or quote.
            </li>
          </ol>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="primary"
              className="rounded-xl"
              onClick={onUploadClick}
              disabled={disabled}
            >
              Choose file
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-slate-800"
              onClick={onDismiss}
            >
              Got it, hide this
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
