import { Plus, FileUp, ListPlus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

type DashboardFABProps = {
  onUpload: () => void;
  onAddScope: () => void;
  onAskAI: () => void;
  className?: string;
};

export function DashboardFAB({
  onUpload,
  onAddScope,
  onAskAI,
  className,
}: DashboardFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: "upload",
      label: "Upload Document",
      icon: FileUp,
      color: "bg-blue-500",
      onClick: () => {
        onUpload();
        setIsOpen(false);
      },
    },
    {
      id: "scope",
      label: "Add Scope Item",
      icon: ListPlus,
      color: "bg-teal-500",
      onClick: () => {
        onAddScope();
        setIsOpen(false);
      },
    },
    {
      id: "ai",
      label: "Ask BLUPRNT AI",
      icon: Sparkles,
      color: "bg-indigo-600",
      onClick: () => {
        onAskAI();
        setIsOpen(false);
      },
    },
  ];

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-60 flex flex-col items-end gap-3",
        className,
      )}
    >
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-2">
            {actions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{
                  delay: (actions.length - 1 - i) * 0.05,
                  duration: 0.2,
                }}
                className="flex items-center gap-3"
              >
                <span className="bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold text-slate-700">
                  {action.label}
                </span>
                <button
                  onClick={action.onClick}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform active:scale-95",
                    action.color,
                  )}
                >
                  <action.icon className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 active:scale-90",
          isOpen
            ? "bg-slate-900 rotate-90"
            : "bg-linear-to-br from-teal-500 to-indigo-600 hover:shadow-teal-500/20",
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-7 h-7" />}
      </button>
    </div>
  );
}
