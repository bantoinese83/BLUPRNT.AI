import { Package, Boxes, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/i18n";
import type { ScopeMetadata } from "@shared/types/metadata";

interface BillOfMaterialsTableProps {
  materials: NonNullable<ScopeMetadata["materials"]>;
}

export function BillOfMaterialsTable({ materials }: BillOfMaterialsTableProps) {
  return (
    <div className="rounded-2xl bg-teal-50/30 border border-teal-100/50 p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-teal-600" />
          <h4 className="text-[11px] font-black text-teal-700 uppercase tracking-[0.15em]">
            Bill of Materials
          </h4>
        </div>
        <Badge
          variant="outline"
          className="bg-white/50 text-[10px] border-teal-200 text-teal-700"
        >
          {materials.length} Items
        </Badge>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 sm:pl-0">
                Material Item
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                Brand
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                Quantity
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">
                Unit Price
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4 sm:pr-0 text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((m, i) => (
              <tr
                key={i}
                className="group hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-4 pl-4 sm:pl-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-white transition-colors border border-slate-100">
                      <Boxes className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {m.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  {m.brand ? (
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-teal-500" />
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-tight">
                        {m.brand}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300 uppercase">
                      Standard
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100/50">
                    {m.quantity} {m.unit || "units"}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-slate-400">
                    {m.estimated_cost ? formatCurrency(m.estimated_cost) : "—"}
                  </span>
                </td>
                <td className="py-4 pr-4 sm:pr-0 text-right">
                  <span className="text-sm font-black text-slate-900 tracking-tight">
                    {m.estimated_cost && m.quantity
                      ? formatCurrency(m.estimated_cost * Number(m.quantity))
                      : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
