import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    /** When set, shows inline error text and sets `aria-invalid`. */
    error?: string;
  };

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, ...props }, ref) => {
    const autoId = React.useId();
    const textareaId = id ?? autoId;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="w-full">
        <textarea
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-rose-500 focus-visible:ring-rose-500/10 focus-visible:ring-offset-0",
            className,
          )}
          ref={ref}
          {...props}
        />
        {error ? (
          <p id={errorId} className="mt-1.5 text-xs text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
