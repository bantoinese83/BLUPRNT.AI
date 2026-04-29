import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
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
  return (
    <div className="space-y-1">
      <h4 className="font-medium text-slate-900 flex items-center gap-2">
        {vendorName &&
        vendorName !== "Vendor" &&
        vendorName !== "Document" &&
        vendorName !== "Processing..." ? (
          vendorName
        ) : (
          <span className="flex items-center gap-2 text-slate-500 italic">
            <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
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
      </h4>
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
          {(aiSummary || isProcessing) && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-teal-50/50 border border-teal-100/50">
              <Sparkles className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <p className="text-sm text-teal-900 leading-relaxed">
                {aiSummary ? (
                  aiSummary
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
