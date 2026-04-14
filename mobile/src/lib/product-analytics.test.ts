import { describe, it, expect, vi, beforeEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

describe("product-analytics", () => {
  beforeEach(() => {
    clearProductAnalyticsConsentCache();
    vi.clearAllMocks();
  });

  it("does not log when consent is off", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await getProductAnalyticsConsent();
    trackProductEvent("screen_view", { screen: "home" });

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("logs in dev when consent is on", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue("1");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await getProductAnalyticsConsent();
    trackProductEvent("screen_view", { screen: "home" });

    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("setProductAnalyticsConsent persists and updates cache", async () => {
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();
    await setProductAnalyticsConsent(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@bluprnt/product_analytics_consent_v1",
      "1",
    );
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    trackProductEvent("tap");
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
