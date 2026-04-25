import { Layers } from "lucide-react";
import { formatCurrency } from "@/lib/i18n";
import type { PhotoToScopeResult } from "@/lib/onboarding-helpers";

interface CostBreakdownTableProps {
  items: PhotoToScopeResult["scope_items"];
}

export function CostBreakdownTable({ items }: CostBreakdownTableProps) {
  return (
    <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="w-4 h-4 text-teal-600" />
        <h4 className="text-[11px] font-black text-teal-700 uppercase tracking-[0.15em]">
          Cost Breakdown
        </h4>
      </div>
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4 sm:pl-0">
                Category
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">
                Scope & Details
              </th>
              <th className="pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4 sm:pr-0 text-right">
                Projected Range
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, i) => (
              <tr
                key={i}
                className="group hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-4 pl-4 sm:pl-0">
                  <p className="text-sm font-bold text-slate-900">
                    {item.category}
                  </p>
                </td>
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                      {item.description}
                    </p>
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </td>
                <td className="py-4 pr-4 sm:pr-0 text-right">
                  <p className="text-sm font-black text-slate-900 tracking-tight">
                    {formatCurrency(item.total_cost_min || 0)} –{" "}
                    {formatCurrency(item.total_cost_max || 0)}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
