import { ShieldCheck, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectRow } from "@shared/types/database";

export function GroundingSourcesSection({ project }: { project: ProjectRow }) {
  const sources = project.grounding_sources || [];

  if (sources.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Trust & Grounding
        </h3>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <Card className="border-emerald-100 bg-emerald-50/20 shadow-sm overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-tight">
              Verified Data Sources
            </span>
          </div>

          <p className="text-[11px] text-emerald-800 leading-relaxed">
            This estimate is anchored in real-world data points specifically for
            your area.
          </p>

          <ul className="space-y-2 pt-1">
            {sources.map((src, idx) => (
              <li key={idx} className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-slate-600 truncate">
                  • {src.title}
                </span>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
