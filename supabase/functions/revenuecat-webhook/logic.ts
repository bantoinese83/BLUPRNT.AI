/** App Store product IDs — keep in sync with mobile `revenuecat-packages.ts`. */
export const IOS_STORE_PRODUCT_PROJECT_PASS = "lifetime";

export type RcEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "PRODUCT_CHANGE"
  | "NON_RENEWING_PURCHASE"
  | "CANCELLATION"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | string;

export type RcWebhookEvent = {
  type: RcEventType;
  app_user_id?: string;
  expiration_at_ms?: number | null;
  product_id?: string | null;
  subscriber_attributes?: Record<
    string,
    { value?: string | null } | undefined
  >;
};

export function isProjectPassStoreProduct(
  productId: string | null | undefined,
): boolean {
  const id = String(productId ?? "").trim().toLowerCase();
  return (
    id === IOS_STORE_PRODUCT_PROJECT_PASS ||
    id === "project_pass" ||
    id.includes("lifetime")
  );
}

export function projectIdFromRcEvent(event: RcWebhookEvent): string | null {
  const raw = event.subscriber_attributes?.project_id?.value;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function mapRcEventToStatus(
  type: RcEventType,
): "active" | "canceled" | "past_due" | "trialing" {
  if (type === "EXPIRATION" || type === "CANCELLATION") return "canceled";
  if (type === "BILLING_ISSUE") return "past_due";
  return "active";
}

export function rcEntitlementActiveForEvent(type: RcEventType): boolean {
  return type !== "EXPIRATION" && type !== "CANCELLATION";
}

export function projectPassExpiresAtIso(from: Date = new Date()): string {
  const expiresAt = new Date(from);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 6);
  return expiresAt.toISOString();
}
