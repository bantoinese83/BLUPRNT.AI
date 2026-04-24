import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardDataStatusProps = {
  loadError: string | null;
  refreshing: boolean;
  onRetry: () => void;
  onDismissError: () => void;
};

export function DashboardDataStatus({
  loadError,
  refreshing,
  onRetry,
  onDismissError,
}: DashboardDataStatusProps) {
  return (
    <>
      {refreshing && (
        <div
          className="pointer-events-none fixed left-0 right-0 top-0 z-60 h-0.5 overflow-hidden bg-slate-200/90"
          aria-hidden
        >
          <div
            className="h-full w-full bg-teal-500/50 transition-all duration-1000 ease-in-out"
            style={{ width: refreshing ? "100%" : "0%" }}
          />
        </div>
      )}
      {loadError && (
        <div
          className="sticky top-16 z-40 border-b border-amber-200/80 bg-amber-50/95 px-4 py-3 backdrop-blur-sm sm:top-17"
          role="alert"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex gap-3 text-sm text-amber-950">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                aria-hidden
              />
              <p className="leading-relaxed">{loadError}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 border-amber-300 bg-white/80 text-amber-950 hover:bg-white"
                onClick={onRetry}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Retry
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-amber-900 hover:bg-amber-100/80"
                onClick={onDismissError}
              >
                <X className="mr-1 h-3.5 w-3.5" aria-hidden />
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
