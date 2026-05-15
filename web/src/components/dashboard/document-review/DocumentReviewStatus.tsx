import { Badge } from "@/components/ui/badge";
import { FileSearch, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LedgerDocumentType } from "@shared/lib/infer-document-type";

interface DocumentReviewStatusProps {
  vendorName: string;
  isProcessing: boolean;
  showCapitalLineLink: boolean;
  paymentStatus: string;
  ledgerDocType: LedgerDocumentType;
  aiSummary: string;
}

export function DocumentReviewStatus({
  vendorName,
  isProcessing,
  showCapitalLineLink,
  paymentStatus,
  ledgerDocType,
  aiSummary,
}: DocumentReviewStatusProps) {
  const extractionFailed = vendorName === "Extraction Failed";

  return (
    <div className="space-y-1">
      <h4 className="font-medium text-slate-900 flex items-center gap-2">
        {vendorName &&
        vendorName !== "Vendor" &&
        vendorName !== "Document" &&
        vendorName !== "Processing..." &&
        !extractionFailed ? (
          vendorName
        ) : extractionFailed ? (
          <span className="text-amber-800 font-semibold">
            Couldn’t read this file automatically
          </span>
        ) : (
          <span className="flex items-center gap-2 text-slate-500 italic">
            <FileSearch className="w-4 h-4 text-teal-500 animate-pulse" />
            AI Extracting...
          </span>
        )}
        {isProcessing && showCapitalLineLink && (
          <Badge
            variant="outline"
            className="text-[10px] text-teal-700 border-teal-200 bg-teal-50 animate-pulse"
          >
            Analyzing Document
          </Badge>
        )}
        {extractionFailed && showCapitalLineLink && (
          <Badge
            variant="outline"
            className="text-[10px] text-amber-800 border-amber-200 bg-amber-50"
          >
            Needs manual entry
          </Badge>
        )}
      </h4>
      {extractionFailed && showCapitalLineLink && (
        <p className="text-xs text-amber-900/90 leading-relaxed max-w-xl">
          Fill in vendor and total from the document (or delete and try a
          clearer PDF or photo). Your upload is saved.
        </p>
      )}
      {showCapitalLineLink && (
        <>
          <Badge
            variant="secondary"
            className={cn(
              "capitalize",
              paymentStatus === "unknown" &&
                ledgerDocType !== "quote" &&
                "animate-pulse bg-teal-50 text-teal-700",
            )}
          >
            {paymentStatus === "unknown"
              ? ledgerDocType === "quote"
                ? "Pending Review"
                : "Processing..."
              : paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
          </Badge>

          {/* AI Summary Section */}
          {(aiSummary || isProcessing || extractionFailed) && (
            <div
              className={
                extractionFailed
                  ? "flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50/60 border border-amber-100/80"
                  : "flex items-start gap-2 px-3 py-2 rounded-xl bg-teal-50/50 border border-teal-100/50"
              }
            >
              <BrainCircuit
                className={
                  extractionFailed
                    ? "w-4 h-4 text-amber-700 mt-0.5 shrink-0"
                    : "w-4 h-4 text-teal-600 mt-0.5 shrink-0"
                }
              />
              <p
                className={
                  extractionFailed
                    ? "text-sm text-amber-950 leading-relaxed"
                    : "text-sm text-teal-900 leading-relaxed"
                }
              >
                {aiSummary ? (
                  aiSummary
                ) : extractionFailed ? (
                  <span className="italic text-amber-900/90">
                    No AI summary for this upload.
                  </span>
                ) : (
                  <span className="italic text-teal-700 animate-pulse">
                    Analyzing Document...
                  </span>
                )}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
