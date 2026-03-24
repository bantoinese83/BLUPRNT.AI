import { motion } from "motion/react";
import { FolderPlus, FilePlus, AlertCircle, LucideIcon } from "lucide-react";
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
  variant?: "projects" | "invoices" | "error";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "projects",
  className,
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
        "flex flex-col items-center justify-center p-12 text-center rounded-[3rem] border border-slate-200/50 bg-white/40 backdrop-blur-sm",
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
          className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl relative z-10"
        >
          <FinalIcon className="w-10 h-10" strokeWidth={1.5} />
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-400 rounded-2xl -rotate-12 opacity-20 blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-500 rounded-full opacity-10 blur-xl" />
      </div>

      <div className="max-w-xs space-y-3 mb-10">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
          {title}
        </h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {action && (
        <Button
          variant="primary"
          size="lg"
          onClick={action.onClick}
          className="group relative px-8 overflow-hidden"
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
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </Button>
      )}

      {/* Help Link */}
      <div className="mt-8">
        <a
          href="mailto:connect@monarch-labs.com"
          className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
        >
          Need help? Contact support
        </a>
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
