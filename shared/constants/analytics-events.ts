/**
 * Product analytics event names for optional analytics (e.g. mobile `trackProductEvent`).
 * Use these strings when wiring a vendor SDK so web and mobile stay comparable later.
 */
export const AnalyticsEvent = {
  ScreenView: "screen_view",
  Tap: "tap",
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
