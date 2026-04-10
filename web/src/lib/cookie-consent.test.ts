import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCookieConsent,
  setCookieConsent,
  openCookieSettings,
  isAnalyticsConsentGranted,
  dispatchCookieConsentChanged,
  CONSENT_KEY,
  OPEN_COOKIE_SETTINGS_EVENT,
  COOKIE_CONSENT_CHANGED_EVENT,
} from "./cookie-consent";

describe("cookie-consent lib", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  describe("openCookieSettings", () => {
    it("should dispatch the custom event", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      openCookieSettings();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: OPEN_COOKIE_SETTINGS_EVENT }),
      );
    });

    it("should do nothing if window is undefined", () => {
      const originalWindow = global.window;
      // @ts-expect-error: Mocking global window
      delete global.window;

      try {
        expect(() => openCookieSettings()).not.toThrow();
      } finally {
        global.window = originalWindow;
      }
    });
  });

  describe("getCookieConsent", () => {
    it("should return null if no consent is stored", () => {
      expect(getCookieConsent()).toBeNull();
    });

    it("should return parsed consent data if it exists", () => {
      const mockData = {
        essential: true,
        analytics: true,
        marketing: false,
        timestamp: new Date().toISOString(),
      };
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(mockData));

      expect(getCookieConsent()).toEqual(mockData);
    });

    it("should return null if JSON parsing fails", () => {
      window.localStorage.setItem(CONSENT_KEY, "invalid-json");
      expect(getCookieConsent()).toBeNull();
    });

    it("should return null if window is undefined", () => {
      const originalWindow = global.window;
      // @ts-expect-error: Mocking global window
      delete global.window;

      try {
        expect(getCookieConsent()).toBeNull();
      } finally {
        global.window = originalWindow;
      }
    });
  });

  describe("setCookieConsent", () => {
    it("should store consent data with a timestamp", () => {
      const consent = {
        essential: true,
        analytics: false,
        marketing: true,
      };

      setCookieConsent(consent);

      const stored = JSON.parse(window.localStorage.getItem(CONSENT_KEY)!);
      expect(stored).toMatchObject(consent);
      expect(stored.timestamp).toBeDefined();
    });

    it("should do nothing if window is undefined", () => {
      const originalWindow = global.window;
      // @ts-expect-error: Mocking global window
      delete global.window;

      try {
        expect(() =>
          setCookieConsent({
            essential: true,
            analytics: true,
            marketing: true,
          }),
        ).not.toThrow();
      } finally {
        global.window = originalWindow;
      }
    });
  });

  describe("isAnalyticsConsentGranted", () => {
    it("is false when nothing is stored", () => {
      expect(isAnalyticsConsentGranted()).toBe(false);
    });

    it("is false when analytics is not explicitly true", () => {
      window.localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          timestamp: new Date().toISOString(),
        }),
      );
      expect(isAnalyticsConsentGranted()).toBe(false);
    });

    it("is true only when analytics is true", () => {
      window.localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          essential: true,
          analytics: true,
          marketing: false,
          timestamp: new Date().toISOString(),
        }),
      );
      expect(isAnalyticsConsentGranted()).toBe(true);
    });
  });

  describe("dispatchCookieConsentChanged", () => {
    it("dispatches the consent-changed event", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      dispatchCookieConsentChanged();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: COOKIE_CONSENT_CHANGED_EVENT }),
      );
    });
  });
});
