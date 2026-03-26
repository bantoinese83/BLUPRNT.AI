import { Pencil, Trash2, Hammer, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money, getStars as stars } from "@/lib/formatters";
import type { ScopeRow } from "@/types/database";

const TIERS = ["economy", "mid", "premium"] as const;

interface ScopeItemRowProps {
  item: ScopeRow;
  isEditing: boolean;
  onEdit: (item: ScopeRow) => void;
  onDelete: (item: ScopeRow) => void;
  onCancelEdit: () => void;
  onSave: (item: ScopeRow) => void;
  editQty: string;
  setEditQty: (qty: string) => void;
  editTier: string;
  setEditTier: (tier: string) => void;
  saving: boolean;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
}

export function ScopeItemRow({
  item,
  isEditing,
  onEdit,
  onDelete,
  onCancelEdit,
  onSave,
  editQty,
  setEditQty,
  editTier,
  setEditTier,
  saving,
  isArchitect,
  hasProjectPass,
}: ScopeItemRowProps) {
  const justification = item.justification || item.metadata?.justification;
  const priority = item.priority || item.metadata?.priority;
  const maintenance = item.maintenance_tips || item.metadata?.maintenance_tips;
  const confidenceReason =
    item.confidence_reason || item.metadata?.confidence_reason;

  if (isEditing) {
    return (
      <div className="p-4 sm:p-6 flex flex-col gap-4 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">{item.category}</h4>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSave(item)}
              disabled={saving}
              className="gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor={`qty-${item.id}`}
            >
              Quantity
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id={`qty-${item.id}`}
                type="number"
                min="0"
                step="0.01"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
              />
              {item.unit && (
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {item.unit}
                </span>
              )}
            </div>
          </div>
          <div>
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor={`tier-${item.id}`}
            >
              Finish tier
            </label>
            <select
              id={`tier-${item.id}`}
              value={editTier}
              onChange={(e) => setEditTier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 hover:bg-slate-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h4 className="font-semibold text-slate-900">{item.category}</h4>
            {priority && (
              <Badge
                variant="secondary"
                className={`text-[10px] h-4.5 px-1.5 uppercase font-black border-none ${
                  priority === "high"
                    ? "bg-red-50 text-red-600"
                    : priority === "medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-slate-50 text-slate-500"
                }`}
              >
                {priority}
              </Badge>
            )}
            {item.finish_tier && (
              <Badge
                variant="outline"
                className="text-[10px] h-4.5 px-1.5 capitalize border-slate-200 text-slate-500"
              >
                {item.finish_tier} tier
              </Badge>
            )}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="p-1 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                aria-label="Edit"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="p-1 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors"
                aria-label="Remove"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-snug">
            {item.description}
          </p>
          {(isArchitect || hasProjectPass) && justification && (
            <p className="text-xs text-slate-400 flex items-start gap-1.5">
              <Hammer className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-400" />
              <span>{justification}</span>
            </p>
          )}
          {(isArchitect || hasProjectPass) && maintenance && (
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold text-indigo-600/70 uppercase tracking-tight">
              <div className="h-1 w-1 rounded-full bg-indigo-300" />
              Care Tip: {maintenance}
            </div>
          )}
          <div className="pt-1 flex items-center gap-1 text-[10px] font-medium text-slate-400">
            {stars(item.confidence_score)}
            <span className="ml-1">
              {confidenceReason || "Regional pricing accuracy"}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <div className="font-bold text-slate-900">
            {money(item.total_cost_min, item.total_cost_max)}
          </div>
          {item.quantity != null && item.unit && (
            <div className="text-xs text-slate-500">
              {item.quantity} {item.unit}
              {item.unit_cost_min != null && item.unit_cost_max != null && (
                <span className="block opacity-70">
                  {money(item.unit_cost_min, item.unit_cost_max)} per{" "}
                  {item.unit}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
