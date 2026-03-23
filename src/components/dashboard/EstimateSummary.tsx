import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Wallet, ListTree } from "lucide-react";

import type { ProjectRow, ScopeRow } from "@/types/database";

function money(a: number | null, b: number | null) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  if (a != null && b != null) return `${fmt(a)} – ${fmt(b)}`;
  if (a != null) return fmt(a);
  return "—";
}

function stars(score: number | null) {
  const n = score != null ? Math.min(5, Math.max(0, Math.round(score))) : 3;
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-3 h-3 ${i < n ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
    />
  ));
}

export function EstimateSummary({
  project,
  scopeItems,
}: {
  project: ProjectRow;
  scopeItems: ScopeRow[];
}) {
  const navigate = useNavigate();
  const conf = project.confidence_score ?? 4.5;

  const isEmpty = scopeItems.length === 0;

  return (
    <Card className="overflow-hidden border-slate-200/60 shadow-md shadow-indigo-100/20 rounded-3xl">
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        {/* Abstract background highlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
        
        <div className="space-y-3 relative z-10">
          <p className="text-indigo-300 text-[11px] font-extrabold uppercase tracking-[0.2em] flex items-center gap-2">
            <Wallet className="w-3.5 h-3.5 shrink-0" aria-hidden />
            Projected Investment
          </p>
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums text-white">
            {money(project.estimated_min_total, project.estimated_max_total)}
          </div>
          <p className="text-slate-400 text-sm font-medium">Full renovation lifecycle estimate</p>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-3 relative z-10">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold px-3 py-1 rounded-lg" title="How well our estimate matches similar projects in your area">
            {conf * 20}% Confidence
          </Badge>
          <div className="flex flex-col md:items-end">
            <div className="flex gap-0.5 mb-1.5">{stars(conf)}</div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-shadow-sm">Regional Match</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-0 bg-white">
        {isEmpty ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
              <ListTree className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">No line items yet</h4>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              We&apos;re still gathering the full scope for your <span className="font-semibold text-slate-700">{project.name}</span>. Run the smart estimate to see detailed category costs.
            </p>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="gap-2.5 rounded-2xl px-8 shadow-lg shadow-indigo-100"
              onClick={() => navigate("/dashboard/scope")}
            >
              <ListTree className="w-5 h-5 shrink-0" aria-hidden />
              Open project scope
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {scopeItems.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="group p-5 sm:p-7 flex flex-col sm:flex-row items-start justify-between gap-6 hover:bg-slate-50/50 transition-all duration-300"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <h4 className="font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{item.category}</h4>
                    {item.finish_tier && (
                      <Badge variant="secondary" className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border-none px-2 py-0.5">
                        {item.finish_tier}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{item.description}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">{stars(item.confidence_score)}</div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market Precision</span>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="font-bold text-lg text-slate-900 tabular-nums mb-0.5">
                    {money(item.total_cost_min, item.total_cost_max)}
                  </div>
                  {item.quantity != null && item.unit && (
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded inline-block">
                      {item.quantity} {item.unit}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {scopeItems.length > 10 && (
              <div className="p-6 bg-slate-50/50 flex justify-center border-t border-slate-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-indigo-600 font-bold tracking-tight hover:bg-indigo-50"
                  onClick={() => navigate("/dashboard/scope")}
                >
                  View {scopeItems.length - 10} more line items
                  <ListTree className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
