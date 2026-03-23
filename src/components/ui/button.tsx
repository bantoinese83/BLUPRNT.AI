import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",

          {
            "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]":
              variant === "default",
            "liquid-metal-button text-white":
              variant === "primary",


            "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]":
              variant === "destructive",
            "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300":
              variant === "outline",
            "bg-slate-100 text-slate-900 hover:bg-slate-200":
              variant === "secondary",
            "text-slate-600 hover:bg-slate-100 hover:text-slate-900":
              variant === "ghost",
            "text-slate-900 underline-offset-4 hover:underline":
              variant === "link",
            "h-10 px-4": size === "default",
            "h-9 rounded-lg px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-6 text-base": size === "lg",
            "h-10 w-10 shrink-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
