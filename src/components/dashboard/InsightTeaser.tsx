import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsightTeaserProps {
  onUpgradeClick: () => void;
  projectName: string;
}

export function InsightTeaser({
  onUpgradeClick,
  projectName,
}: InsightTeaserProps) {
  return (
    <div className="p-6 bg-indigo-50/30 border-t border-slate-100 relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full -mr-16 -mt-16" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded">
                Architect Insight
              </span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h4 className="font-bold text-slate-900 group-hover:text-indigo-950 transition-colors">
              Unlock strategic savings for {projectName}
            </h4>
            <div className="relative">
              <p className="text-sm text-slate-500 leading-relaxed blur-[3px] select-none pointer-events-none">
                Kitchen remodels in this area usually save 12% on materials by
                choosing Grade-B quartz over entry-level granite. Use our
                regional breakdown to...
              </p>
              <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-indigo-50/30 to-transparent" />
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onUpgradeClick}
          className="shrink-0 font-bold gap-2 rounded-xl px-5 h-10 premium-gradient shadow-lg shadow-indigo-500/20"
        >
          See AI Insights
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
