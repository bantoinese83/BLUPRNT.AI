import { motion } from "motion/react";
import {
  FolderPlus,
  FilePlus,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Lower-emphasis path (e.g. try an estimate before committing to a full project). */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: "projects" | "invoices" | "error";
  className?: string;
  currentStep?: number;
}

function RoadmapStep({
  number,
  label,
  isActive,
}: {
  number: number;
  label: string;
  isActive: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-500",
          isActive
            ? "bg-teal-600 text-white shadow-lg shadow-teal-200 scale-110"
            : "bg-slate-100 text-slate-400",
        )}
      >
        {number}
      </div>
      <span
        className={cn(
          "text-[9px] font-black uppercase tracking-widest transition-colors duration-500",
          isActive ? "text-teal-600" : "text-slate-400",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "projects",
  className,
  currentStep = 1,
}: EmptyStateProps) {
  const DefaultIcon = {
    projects: FolderPlus,
    invoices: FilePlus,
    error: AlertCircle,
  }[variant];

  const FinalIcon = Icon || DefaultIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center rounded-[3rem] border border-slate-200/50 bg-white/40 backdrop-blur-sm shadow-xl shadow-slate-100/50",
        className,
      )}
    >
      <div className="relative mb-8">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-24 h-24 rounded-[2.25rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl relative z-10"
        >
          <FinalIcon className="w-10 h-10" strokeWidth={1.5} />
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-teal-500 rounded-2xl -rotate-12 opacity-20 blur-xl animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-emerald-500 rounded-full opacity-10 blur-xl" />
      </div>

      <div className="max-w-xs space-y-3 mb-10">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
          {description}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col items-stretch gap-3">
        {action && (
          <Button
            variant="primary"
            size="lg"
            onClick={action.onClick}
            className="group relative px-10 h-14 text-sm font-black rounded-2xl liquid-metal-button shadow-xl shadow-teal-200/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              {action.label}
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <FilePlus className="w-4 h-4" />
              </motion.span>
            </span>
          </Button>
        )}
        {secondaryAction && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={secondaryAction.onClick}
            className="h-12 rounded-2xl border-slate-200 bg-white/80 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>

      {/* Help Link & Getting Started */}
      <div className="mt-12 space-y-6 flex flex-col items-center">
        {variant === "projects" && (
          <div className="flex items-center gap-6 py-5 px-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <RoadmapStep
              number={1}
              label="Vision"
              isActive={currentStep === 1}
            />
            <div className="w-6 h-px bg-slate-100" />
            <RoadmapStep
              number={2}
              label="Estimate"
              isActive={currentStep === 2}
            />
            <div className="w-6 h-px bg-slate-100" />
            <RoadmapStep
              number={3}
              label="Ledger"
              isActive={currentStep === 3}
            />
          </div>
        )}

        <motion.a
          href="mailto:connect@monarch-labs.com"
          whileHover={{ y: -1 }}
          className="text-xs font-semibold text-slate-400 hover:text-teal-600 transition-colors flex items-center gap-1.5"
        >
          Need help? Contact support
        </motion.a>
      </div>

      {/* Branded watermark */}
      <div className="mt-8 opacity-[0.03] pointer-events-none select-none">
        <svg width="120" height="40" viewBox="0 0 120 40" fill="currentColor">
          <text
            x="0"
            y="30"
            fontSize="24"
            fontWeight="900"
            letterSpacing="0.2em"
          >
            BLUPRNT
          </text>
        </svg>
      </div>
    </motion.div>
  );
}
