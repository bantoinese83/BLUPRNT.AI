import { cn } from "@/lib/utils";

interface DocumentReviewTotalProps {
  total: number;
  isProcessing: boolean;
}

export function DocumentReviewTotal({
  total,
  isProcessing,
}: DocumentReviewTotalProps) {
  return (
    <div className="text-right">
      <p className="text-2xl font-bold text-slate-900">
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(total ?? 0)}
      </p>
      {(!total || total === 0) && (
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            isProcessing
              ? "text-teal-600/50 italic animate-pulse"
              : "text-amber-700",
          )}
        >
          {isProcessing ? "Calculating..." : "Verify Total"}
        </p>
      )}
    </div>
  );
}
