import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/formatters";

interface ScopeSummaryProps {
  minTotal: number | null;
  maxTotal: number | null;
  confidenceScore: number;
}

export function ScopeSummary({
  minTotal,
  maxTotal,
  confidenceScore,
}: ScopeSummaryProps) {
  return (
    <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-slate-400 text-sm font-medium">Estimated total</p>
        <div className="text-3xl font-bold tracking-tight">
          {money(minTotal, maxTotal)}
        </div>
      </div>
      <Badge className="bg-slate-800 text-slate-300 border-slate-700">
        Confidence: {confidenceScore}/5
      </Badge>
    </div>
  );
}
