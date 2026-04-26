import { Package, Boxes, Tag, Activity } from "lucide-react";
import { money } from "@/lib/formatters";
import type { ScopeRow } from "@shared/types/database";

interface BillOfMaterialsListProps {
  materials: NonNullable<ScopeRow["metadata"]>["materials"];
}

export function BillOfMaterialsList({ materials }: BillOfMaterialsListProps) {
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
