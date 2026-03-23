/** Dispatched globally so any footer or settings link can reopen the cookie preferences UI */
export const OPEN_COOKIE_SETTINGS_EVENT = "bluprnt:open-cookie-settings" as const;

export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
