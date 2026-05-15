import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = ({
  children,
  value,
  onValueChange,
  className,
}: {
  children: React.ReactNode;
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
}) => {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement<{
            value: string;
            onValueChange: (v: string) => void;
          }>(child)
        ) {
          return React.cloneElement(child, {
            value,
            onValueChange,
          });
        }

        return child;
      })}
    </div>
  );
};

const TabsList = ({
  children,
  value,
  onValueChange,
  className,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-center", className)}>
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement<{
            activeValue: string;
            onValueChange: (v: string) => void;
          }>(child)
        ) {
          return React.cloneElement(child, {
            activeValue: value!,
            onValueChange: onValueChange!,
          });
        }

        return child;
      })}
    </div>
  );
};

const TabsTrigger = ({
  value,
  activeValue,
  onValueChange,
  children,
  className,
}: {
  value: string;
  activeValue?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) => {
  const isActive = value === activeValue;
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value)}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "flex items-center justify-center transition-all",
        className,
      )}
    >
      {children}
    </button>
  );
};

export { Tabs, TabsList, TabsTrigger };
