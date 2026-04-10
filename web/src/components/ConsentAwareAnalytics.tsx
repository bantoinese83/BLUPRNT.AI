import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  isAnalyticsConsentGranted,
} from "@/lib/cookie-consent";

/**
 * Loads Vercel Web Analytics only when the user has explicitly opted in via the
 * cookie banner (ePrivacy / GDPR-aligned behavior).
 */
export function ConsentAwareAnalytics() {
  const [enabled, setEnabled] = useState(() => isAnalyticsConsentGranted());

  useEffect(() => {
    const sync = () => setEnabled(isAnalyticsConsentGranted());
    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!enabled) return null;
  return <Analytics />;
}
