import { describe, it, expect, vi, beforeEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AnalyticsEvent } from "@shared/constants/analytics-events";
import { posthog } from "@/lib/posthog";
import {
  clearProductAnalyticsConsentCache,
  getProductAnalyticsConsent,
  setProductAnalyticsConsent,
  trackProductEvent,
} from "@/lib/product-analytics";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock("@/lib/posthog", () => ({
  posthog: {
    capture: vi.fn(),
    optIn: vi.fn(),
    optOut: vi.fn(),
  },
}));

describe("product-analytics", () => {
  beforeEach(() => {
    clearProductAnalyticsConsentCache();
    vi.clearAllMocks();
  });

  it("does not log when consent is off", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const log = vi.spyOn(console, "info").mockImplementation(() => {});

    await getProductAnalyticsConsent();
    trackProductEvent(AnalyticsEvent.ScreenView, { screen: "home" });

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("logs in dev when consent is on", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue("1");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});

    await getProductAnalyticsConsent();
    trackProductEvent(AnalyticsEvent.ScreenView, { screen: "home" });

    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("setProductAnalyticsConsent persists and updates cache and posthog", async () => {
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();
    await setProductAnalyticsConsent(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@bluprnt/product_analytics_consent_v1",
      "1",
    );
    expect(posthog.optIn).toHaveBeenCalled();

    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    trackProductEvent(AnalyticsEvent.Tap);
    expect(log).toHaveBeenCalled();
    expect(posthog.capture).toHaveBeenCalledWith(AnalyticsEvent.Tap, undefined);
    log.mockRestore();

    await setProductAnalyticsConsent(false);
    expect(posthog.optOut).toHaveBeenCalled();
  });
});
