import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Non-blocking notice when the browser reports offline (navigator.onLine).
 */
export function WebOfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      data-testid="web-offline-banner"
      className="fixed left-0 right-0 top-0 z-[85] flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-950 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      You&apos;re offline. Check your connection—we&apos;ll load again when
      you&apos;re back online.
    </div>
  );
}
