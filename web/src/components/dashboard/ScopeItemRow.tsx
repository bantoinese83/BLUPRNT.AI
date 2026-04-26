import {
  Pencil,
  Trash2,
  Hammer,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Package,
  Boxes,
  Tag,
  Plus,
  X,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money, getStars as stars } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ScopeRow } from "@shared/types/database";
import type { ReconciliationItem } from "@shared/lib/reconciliation";
import type { BillOfMaterialItem as Material } from "@shared/types/onboarding";

// Material type now imported as BillOfMaterialItem from shared types

function BillOfMaterialsList({
  materials,
}: {
  materials: NonNullable<ScopeRow["metadata"]>["materials"];
}) {
  if (!materials || materials.length === 0) return null;

  return (
    <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-4 h-4 text-teal-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Bill of Materials
        </span>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/60">
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 sm:pl-0">
                Material Item
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                Brand / Model
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                Quantity
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4 sm:pr-0 text-right">
                Cost
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((m, i) => (
              <tr key={i} className="group hover:bg-white/50 transition-colors">
                <td className="py-3.5 pl-4 sm:pl-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-xs">
                      <Boxes className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {m.name}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-1">
                    {m.brand && (
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-teal-500" />
                        <span className="text-[10px] font-black text-teal-600 uppercase tracking-tight">
                          {m.brand}
                        </span>
                      </div>
                    )}
                    {m.model && (
                      <span className="text-[10px] font-bold text-slate-400 italic">
                        {m.model}
                      </span>
                    )}
                    {!m.brand && !m.model && (
                      <span className="text-[10px] font-bold text-slate-300 uppercase">
                        Standard
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[11px] font-black text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-xs">
                    {m.quantity} {m.unit || "units"}
                  </span>
                </td>
                <td className="py-3.5 pr-4 sm:pr-0 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[13px] font-black text-slate-900 tabular-nums">
                      {m.estimated_cost ? money(m.estimated_cost) : "—"}
                    </span>
                    {m.estimated_cost &&
                      m.quantity &&
                      Number(m.quantity) > 1 && (
                        <span className="text-[10px] font-medium text-slate-400 tabular-nums italic">
                          Total: {money(m.estimated_cost * Number(m.quantity))}
                        </span>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2 flex items-center justify-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-2.5 h-2.5 text-emerald-500" />
          Quantities grounded in regional waste factors
        </p>
      </div>
    </div>
  );
}

function EditableMaterialList({
  materials,
  onChange,
}: {
  materials: Material[];
  onChange: (m: Material[]) => void;
}) {
  const addMaterial = () => {
    onChange([...materials, { name: "", quantity: 1, unit: "pc" }]);
  };

  const removeMaterial = (idx: number) => {
    onChange(materials.filter((_, i) => i !== idx));
  };

  const updateMaterial = (idx: number, updates: Partial<Material>) => {
    onChange(materials.map((m, i) => (i === idx ? { ...m, ...updates } : m)));
  };

  return (
    <div className="space-y-4 mt-4 border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Package className="w-3 h-3" />
          Bill of Materials
        </h5>
        <Button
          variant="ghost"
          size="sm"
          onClick={addMaterial}
          className="h-7 px-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 gap-1 rounded-lg"
        >
          <Plus className="w-3 h-3" />
          Add Item
        </Button>
      </div>

      {materials.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic py-2">
          No materials listed for this item.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">
                  Material Name
                </th>
                <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  Brand / Model
                </th>
                <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  Cost ($)
                </th>
                <th className="pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                  Qty / Unit
                </th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {materials.map((m, idx) => (
                <tr key={idx} className="group">
                  <td className="py-2 pl-2">
                    <input
                      type="text"
                      placeholder="Material name"
                      value={m.name}
                      onChange={(e) =>
                        updateMaterial(idx, { name: e.target.value })
                      }
                      className="w-full text-xs font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Brand"
                        value={m.brand || ""}
                        onChange={(e) =>
                          updateMaterial(idx, { brand: e.target.value })
                        }
                        className="w-full text-[10px] font-medium text-teal-600 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300"
                      />
                      <input
                        type="text"
                        placeholder="Model"
                        value={m.model || ""}
                        onChange={(e) =>
                          updateMaterial(idx, { model: e.target.value })
                        }
                        className="w-full text-[9px] font-medium text-slate-400 italic bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-200"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={m.estimated_cost || ""}
                      onChange={(e) =>
                        updateMaterial(idx, {
                          estimated_cost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20 text-xs font-bold text-slate-700 bg-slate-50/50 px-2 py-1 rounded border border-transparent focus:border-slate-200 focus:bg-white focus:ring-0 transition-all placeholder:text-slate-300"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={m.quantity || 0}
                        onChange={(e) =>
                          updateMaterial(idx, {
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-12 text-xs font-bold text-slate-700 bg-slate-50/50 px-2 py-1 rounded border border-transparent focus:border-slate-200 focus:bg-white focus:ring-0 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="unit"
                        value={m.unit || ""}
                        onChange={(e) =>
                          updateMaterial(idx, { unit: e.target.value })
                        }
                        className="w-12 text-[10px] font-bold text-slate-400 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-200 uppercase tracking-tighter"
                      />
                    </div>
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeMaterial(idx)}
                      className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TIERS = ["economy", "mid", "premium"] as const;

interface ScopeItemRowProps {
  item: ScopeRow;
  reconciliation?: ReconciliationItem | null;
  isEditing: boolean;
  onEdit: (item: ScopeRow) => void;
  onDelete: (item: ScopeRow) => void;
  onCancelEdit: () => void;
  onSave: (item: ScopeRow) => void;
  editQty: string;
  setEditQty: (qty: string) => void;
  editTier: string;
  setEditTier: (tier: string) => void;
  editMaterials: Material[];
  setEditMaterials: (m: Material[]) => void;
  saving: boolean;
  isArchitect?: boolean;
  hasProjectPass?: boolean;
}

export function ScopeItemRow({
  item,
  reconciliation,
  isEditing,
  onEdit,
  onDelete,
  onCancelEdit,
  onSave,
  editQty,
  setEditQty,
  editTier,
  setEditTier,
  editMaterials,
  setEditMaterials,
  saving,
  isArchitect,
  hasProjectPass,
}: ScopeItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

        <EditableMaterialList
          materials={editMaterials}
          onChange={setEditMaterials}
        />
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
              <Hammer className="w-3.5 h-3.5 mt-0.5 shrink-0 text-teal-400" />
              <span>{justification}</span>
            </p>
          )}
          {(isArchitect || hasProjectPass) && maintenance && (
            <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold text-teal-600/70 uppercase tracking-tight">
              <div className="h-1 w-1 rounded-full bg-teal-300" />
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
          {reconciliation && reconciliation.total_billed > 0 && (
            <div
              className={cn(
                "flex items-center justify-end gap-1.5 text-[10px] font-black uppercase tracking-tighter",
                reconciliation.status === "reconciled"
                  ? "text-emerald-600"
                  : reconciliation.status === "over"
                    ? "text-rose-600"
                    : "text-amber-600",
              )}
            >
              {reconciliation.status === "reconciled" ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : reconciliation.status === "over" ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <Info className="w-3 h-3" />
              )}
              Billed {money(reconciliation.total_billed)}
            </div>
          )}
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

      {item.metadata?.materials && item.metadata.materials.length > 0 && (
        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "h-8 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all",
              isExpanded
                ? "bg-teal-600 text-white hover:bg-teal-500 shadow-sm"
                : "bg-white text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50",
            )}
          >
            {isExpanded ? "Hide Details" : "View Breakdown"}
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 ml-1.5" />
            ) : (
              <ChevronDown className="w-3 h-3 ml-1.5" />
            )}
          </Button>
        </div>
      )}

      <AnimatePresence>
        {isExpanded && item.metadata?.materials && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <BillOfMaterialsList materials={item.metadata.materials} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
