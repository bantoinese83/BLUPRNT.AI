import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DashboardEmptyPanelProps = {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  /** Primary control(s) — button(s) or links */
  action?: ReactNode;
  className?: string;
  /**
   * `comfortable` — estimate-style hero empty (larger icon, more vertical space).
   * `compact` — ledger / scope card empty (tighter, matches invoice drop zone).
   */
  density?: "comfortable" | "compact";
};

/**
 * Shared empty-state layout for dashboard modules (scope, invoices, estimates).
 * Keeps icon, title, description, and CTA rhythm consistent with {@link EmptyState} on the shell.
 */
export function DashboardEmptyPanel({
  icon: Icon,
  title,
  description,
  action,
  className,
  density = "compact",
}: DashboardEmptyPanelProps) {
  const isComfortable = density === "comfortable";

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center max-w-md mx-auto",
        isComfortable ? "py-20 px-6" : "p-10 sm:p-14",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm",
          isComfortable ? "w-20 h-20" : "w-14 h-14 rounded-2xl mb-4",
        )}
      >
        <Icon
          className={cn(
            "text-slate-300",
            isComfortable ? "w-10 h-10" : "w-7 h-7 text-slate-400",
          )}
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      {isComfortable ? (
        <h4 className="text-xl font-bold text-slate-900 mb-2">{title}</h4>
      ) : (
        <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      )}
      <p
        className={cn(
          "text-slate-500 max-w-sm leading-relaxed text-sm",
          isComfortable ? "mb-8" : "mb-6 text-slate-600",
        )}
      >
        {description}
      </p>
      {action ? (
        <div className="flex flex-col items-stretch gap-3 w-full sm:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
