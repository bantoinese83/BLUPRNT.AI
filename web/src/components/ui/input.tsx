import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** When set, shows inline error text and sets `aria-invalid`. */
  error?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        <input
          id={inputId}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition-all shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/10",
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
Input.displayName = "Input";

export { Input };
