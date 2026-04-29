import AsyncStorage from "@react-native-async-storage/async-storage";

import { Sentry } from "@/lib/sentry";
import { posthog } from "@/lib/posthog";

const STORAGE_KEY = "@bluprnt/product_analytics_consent_v1";

/** In-memory cache so `trackProductEvent` avoids async reads on the hot path. */
let consentCache: boolean | null = null;

/** Resets the in-memory consent flag (e.g. after tests or a storage wipe). */
export function clearProductAnalyticsConsentCache(): void {
  consentCache = null;
}

export async function getProductAnalyticsConsent(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const on = raw === "1";
  consentCache = on;
  return on;
}

export async function setProductAnalyticsConsent(
  enabled: boolean,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  consentCache = enabled;
  if (enabled) {
    posthog.optIn();
  } else {
    posthog.optOut();
  }
}

function isProductAnalyticsConsentGranted(): boolean {
  return consentCache === true;
}

export type ProductAnalyticsHandler = (
  name: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) => void;

let sdkHandler: ProductAnalyticsHandler | null = null;

/** Wire a vendor SDK (e.g. Segment, Amplitude); only runs when consent is on. */
export function setProductAnalyticsHandler(
  handler: ProductAnalyticsHandler | null,
): void {
  sdkHandler = handler;
}

/**
 * Forward to {@link setProductAnalyticsHandler} when integrated.
 * No events are sent unless the user has opted in via Profile.
 * Prefer `AnalyticsEvent` values from `@shared/constants/analytics-events` for `name` so platforms stay aligned.
 */
export function trackProductEvent(
  name: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (!isProductAnalyticsConsentGranted()) return;
  sdkHandler?.(name, properties);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  posthog.capture(name, properties as any);

  // Fallback to Sentry breadcrumbs for production observability
  if (!__DEV__) {
    Sentry.addBreadcrumb({
      category: "analytics",
      message: name,
      data: properties ?? {},
      level: "info",
    });
  }

  if (__DEV__) {
    // Only log in dev to keep production logs clean, but ensure it's high signal
    console.info(`[Analytics] ${name}`, properties ?? {});
  }
}
