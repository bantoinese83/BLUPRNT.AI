import { Package, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BillOfMaterialItem as Material } from "@shared/types/onboarding";

interface EditableMaterialListProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
}

export function EditableMaterialList({
  materials,
  onChange,
}: EditableMaterialListProps) {
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
