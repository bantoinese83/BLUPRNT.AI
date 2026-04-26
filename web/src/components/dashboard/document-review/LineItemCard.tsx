import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LineItem {
  id: string;
  description: string;
  line_total: number;
  scope_item_id?: string | null;
}

interface ScopeItem {
  id: string;
  category: string;
}

interface LineItemCardProps {
  line: LineItem;
  mapping: string | undefined;
  scopeItems: ScopeItem[];
  onMappingChange: (lineId: string, scopeItemId: string) => void;
}

export function LineItemCard({
  line,
  mapping,
  scopeItems,
  onMappingChange,
}: LineItemCardProps) {
  const isUnmapped = !(mapping ?? line.scope_item_id);
  const showOverrunHint = isUnmapped && scopeItems.length > 0;

  return (
    <Card
      className={`p-3 transition-colors ${
        showOverrunHint ? "border-amber-200 bg-amber-50/50" : "border-slate-200"
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <p
            className="font-medium text-slate-900 truncate"
            title={line.description}
          >
            {line.description}
          </p>
          <p className="text-sm text-slate-500">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(line.line_total)}
          </p>
          {showOverrunHint && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />
              Not in your original budget
            </p>
          )}
        </div>
        <select
          value={mapping ?? line.scope_item_id ?? ""}
          onChange={(e) => onMappingChange(line.id, e.target.value)}
          className="text-sm rounded-lg border border-slate-300 bg-white px-2 py-1 shrink-0 max-w-[150px]"
        >
          <option value="">— Not linked</option>
          {scopeItems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.category}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
}
