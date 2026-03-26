import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ScopeHeaderProps {
  projectName: string;
  error: string | null;
}

export function ScopeHeader({ projectName, error }: ScopeHeaderProps) {
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

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Line-by-line costs
        </h2>
        <p className="text-slate-500">
          Detailed breakdown for {projectName}. Tap an item to edit quantity or
          tier.
        </p>
        {error && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
