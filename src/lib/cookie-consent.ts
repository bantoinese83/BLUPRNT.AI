/** Dispatched globally so any footer or settings link can reopen the cookie preferences UI */
export const OPEN_COOKIE_SETTINGS_EVENT =
  "bluprnt:open-cookie-settings" as const;

export const CONSENT_KEY = "bluprnt_cookie_consent_v1";

export interface CookieConsentData {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

export function getCookieConsent(): CookieConsentData | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CookieConsentData;
  } catch {
    return null;
  }
}

export function setCookieConsent(
  consent: Omit<CookieConsentData, "timestamp">,
): void {
  if (typeof window === "undefined") return;
  const data: CookieConsentData = {
    ...consent,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
}
