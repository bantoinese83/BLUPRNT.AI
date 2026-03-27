import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertTriangle, Lightbulb, TrendingUp, ChevronRight } from 'lucide-react';
import { useAwareness } from '@/contexts/AwarenessProvider';
import { Button } from '@/components/ui/button';

export function SmartSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { insights, projectHealth } = useAwareness();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md glass-deep z-[101] p-6 flex flex-col gap-6 shadow-2xl overflow-hidden"
          >
            <div className="noise-overlay" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${projectHealth === 'optimal' ? 'bg-emerald-400/20 text-emerald-400' : projectHealth === 'warning' ? 'bg-amber-400/20 text-amber-400' : 'bg-rose-400/20 text-rose-400'}`}>
                  <img src="/insights-icon.svg" alt="" className="w-5 h-5 brightness-0 invert opacity-90" aria-hidden />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white">Smart Insights</h2>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    Project Status: {projectHealth}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-slate-400 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar relative z-10">
              {insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                  <div className="p-4 rounded-3xl bg-slate-800/50 border border-white/5">
                    <Lightbulb className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-400 max-w-[200px]">
                    Your project looks solid. Check back later for new insights!
                  </p>
                </div>
              ) : (
                insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                        insight.type === 'anomaly' ? 'bg-rose-500/10 text-rose-400' : 
                        insight.type === 'opportunity' ? 'bg-indigo-500/10 text-indigo-400' : 
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {insight.type === 'anomaly' ? <AlertTriangle className="w-4 h-4" /> : 
                         insight.type === 'opportunity' ? <TrendingUp className="w-4 h-4" /> : 
                         <Lightbulb className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {insight.title}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {insight.description}
                        </p>
                        {insight.actionLabel && (
                          <button className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-2 hover:text-indigo-300 transition-colors">
                            {insight.actionLabel}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-white/5 relative z-10">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-[10px] text-indigo-300 leading-relaxed">
                  <span className="font-bold">Pro Tip:</span> Keeping your project data up to date ensures these insights remain accurate and actionable.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
