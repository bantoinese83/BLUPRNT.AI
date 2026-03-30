import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ScopeHeaderProps {
  projectName: string;
  itemCount?: number;
  error: string | null;
  onAddClick?: () => void;
}

export function ScopeHeader({
  projectName,
  itemCount,
  error,
  onAddClick,
}: ScopeHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-slate-600"
          onClick={() => navigate("/dashboard/plan")}
          type="button"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          Back to plan
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Line-by-line costs
            </h2>
            {itemCount !== undefined && (
              <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-200">
                {itemCount} Items
              </span>
            )}
          </div>
          <p className="text-slate-500 max-w-sm">
            Detailed breakdown for {projectName}. Tap an item to edit quantity
            or tier.
          </p>
        </div>

        <Button
          onClick={onAddClick}
          className="gap-2 rounded-2xl h-12 px-6 premium-gradient text-white font-bold shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </Button>
      </div>
      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
