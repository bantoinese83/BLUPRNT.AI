import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAwareness, type SmartInsight } from "@/contexts/AwarenessContext";
import { Button } from "@/components/ui/button";

export function SmartSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { insights, projectHealth } = useAwareness();

  const runInsightAction = useCallback(
    (insight: SmartInsight) => {
      if (!insight.actionKind) return;
      onClose();
      if (insight.actionKind === "scope") navigate("/dashboard/scope");
      else if (insight.actionKind === "execute") navigate("/dashboard/execute");
      else if (insight.actionKind === "record") navigate("/dashboard/record");
    },
    [navigate, onClose],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/10 backdrop-blur-2xl z-100"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-4 top-4 bottom-4 w-full max-w-md bg-white/40 backdrop-blur-3xl border border-white/20 z-101 p-6 flex flex-col gap-6 shadow-spatial rounded-[2.5rem] overflow-hidden"
          >
            <div className="noise-overlay" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${projectHealth === "optimal" ? "bg-emerald-400/20 text-emerald-400" : projectHealth === "warning" ? "bg-amber-400/20 text-amber-400" : "bg-rose-400/20 text-rose-400"}`}
                >
                  <img
                    src="/insights-icon.svg"
                    alt=""
                    className="w-5 h-5 opacity-90"
                    aria-hidden
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    Smart Insights
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    Project Status: {projectHealth}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
              {insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                  <div className="p-4 rounded-3xl bg-slate-100 border border-slate-200">
                    <Lightbulb className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 max-w-[200px]">
                    Your project looks solid. Check back later for new insights!
                  </p>
                </div>
              ) : (
                insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all group"
                  >
                    <div className="flex gap-4">
                      <div
                        className={`mt-1 p-2 rounded-lg shrink-0 ${
                          insight.type === "anomaly"
                            ? "bg-rose-500/10 text-rose-400"
                            : insight.type === "opportunity"
                              ? "bg-teal-500/10 text-teal-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {insight.type === "anomaly" ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : insight.type === "opportunity" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <Lightbulb className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                          {insight.title}
                        </h4>
                        <div className="text-xs text-slate-500 leading-relaxed markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                            {insight.description}
                          </ReactMarkdown>
                        </div>
                        {insight.actionLabel && insight.actionKind && (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal-600 mt-2 hover:text-teal-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-md"
                            onClick={() => runInsightAction(insight)}
                          >
                            {insight.actionLabel}
                            <ChevronRight className="w-3 h-3" aria-hidden />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100 relative z-10">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
                <p className="text-[10px] text-teal-600 leading-relaxed">
                  <span className="font-black">Architect Tip:</span> Keeping
                  your project data up to date ensures these insights remain
                  accurate and actionable.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
