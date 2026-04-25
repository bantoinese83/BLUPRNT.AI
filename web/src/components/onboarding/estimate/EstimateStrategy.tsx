import { Wrench, Search, ExternalLink } from "lucide-react";

interface EstimateStrategyProps {
  tips?: string[];
  sources?: { title: string; url?: string }[];
}

export function EstimateStrategy({ tips, sources }: EstimateStrategyProps) {
  if (!tips?.length && !sources?.length) return null;

  return (
    <div className="px-8 pb-8 space-y-8">
      {tips && tips.length > 0 && (
        <div className="rounded-2xl bg-teal-50/50 border border-teal-100/50 p-5 space-y-3">
          <h5 className="text-xs font-black text-teal-700 uppercase tracking-widest flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5" />
            AI Project Strategy
          </h5>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li
                key={i}
                className="text-sm text-slate-700 leading-snug flex gap-2"
              >
                <span className="text-teal-400 font-bold">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {sources && sources.length > 0 && (
        <div className="space-y-4">
          <div className="h-px bg-slate-100 w-full" />
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Search className="w-3 h-3" />
              Verified Market Sources
            </h5>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all group"
                >
                  <span className="text-xs font-bold text-slate-600 group-hover:text-teal-700">
                    {src.title}
                  </span>
                  {src.url && (
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-teal-500" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
