import type { ReactNode } from "react";
import { useWebVersionCheck } from "@/hooks/useWebVersionCheck";

type Props = { children: ReactNode };

/**
 * Blocks the app when the deployed build is older than `min_supported_web_version`.
 */
export function ForceUpdateGate({ children }: Props) {
  const { isChecking, isOutdated } = useWebVersionCheck();

  if (isChecking) {
    return <>{children}</>;
  }

  if (!isOutdated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-white">
      <h1 className="text-xl font-semibold tracking-tight">
        Please refresh this page
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-300">
        An update is available. Refresh to load the latest version and keep
        working without interruptions.
      </p>
      <button
        type="button"
        className="rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-900/30 outline-none ring-offset-2 ring-offset-slate-950 hover:bg-teal-400 focus-visible:ring-2 focus-visible:ring-teal-300"
        onClick={() => {
          globalThis.location.reload();
        }}
      >
        Refresh now
      </button>
    </div>
  );
}
