import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 text-slate-600"
      role="status"
      aria-label="Loading page"
    >
      <Loader2
        className="w-10 h-10 text-indigo-600 animate-spin"
        aria-hidden
      />
      <p className="text-sm font-medium">Loading…</p>
    </div>
  );
}
