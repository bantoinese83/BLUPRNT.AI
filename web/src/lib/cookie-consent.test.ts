// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getCookieConsent,
  setCookieConsent,
  isAnalyticsConsentGranted,
  CONSENT_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
  COOKIE_CONSENT_CHANGED_EVENT,
  openCookieSettings,
  dispatchCookieConsentChanged,
} from "./cookie-consent";

describe("cookie-consent utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns null if no consent is stored", () => {
    expect(getCookieConsent()).toBeNull();
  });

  it("stores and retrieves consent data", () => {
    const consent = {
      essential: true,
      analytics: true,
      marketing: false,
    };
    setCookieConsent(consent);

    const retrieved = getCookieConsent();
    expect(retrieved).toMatchObject(consent);
    expect(retrieved?.timestamp).toBeDefined();
  });

  it("identifies if analytics consent is granted", () => {
    expect(isAnalyticsConsentGranted()).toBe(false);

    setCookieConsent({ essential: true, analytics: true, marketing: false });
    expect(isAnalyticsConsentGranted()).toBe(true);

    setCookieConsent({ essential: true, analytics: false, marketing: false });
    expect(isAnalyticsConsentGranted()).toBe(false);
  });

  it("dispatches open settings event", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    openCookieSettings();
    expect(spy).toHaveBeenCalledWith(expect.any(Event));
    expect(spy.mock.calls[0]![0]!.type).toBe(OPEN_COOKIE_SETTINGS_EVENT);
  });

  it("dispatches consent changed event", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    dispatchCookieConsentChanged();
    expect(spy).toHaveBeenCalledWith(expect.any(Event));
    expect(spy.mock.calls[0]![0]!.type).toBe(COOKIE_CONSENT_CHANGED_EVENT);
  });

  it("handles corrupted JSON in localStorage", () => {
    localStorage.setItem(CONSENT_KEY, "invalid-json");
    expect(getCookieConsent()).toBeNull();
  });
});
