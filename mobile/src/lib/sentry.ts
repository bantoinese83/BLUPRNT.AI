import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || "";

let initialized = false;

/** True when DSN is set — use before `Sentry.wrap` so wrap never runs without `init`. */
export function isSentryConfigured(): boolean {
  return Boolean(dsn);
}

export function initMobileSentry(): void {
  if (initialized || !dsn) {
    return;
  }
  initialized = true;
  Sentry.init({
    dsn,
    environment: __DEV__ ? "development" : "production",
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 0 : 0.1,
    beforeSend(event) {
      if (event.request?.headers) {
        const h = { ...event.request.headers };
        if (h.Authorization) h.Authorization = "[redacted]";
        event.request.headers = h;
      }
      return event;
    },
  });
}

export function captureEdgeInvokeFailure(
  functionName: string,
  error: unknown,
): void {
  if (!initialized) {
    return;
  }
  const status =
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  Sentry.captureException(
    error instanceof Error
      ? error
      : new Error(`Edge invoke: ${functionName}: ${message}`),
    {
      tags: { edge_function: functionName },
      extra: { status },
    },
  );
}

/** High-level product flow markers (no PII). Only recorded when Sentry is initialized. */
export function addUserFlowBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!initialized) {
    return;
  }
  Sentry.addBreadcrumb({
    category: "user_flow",
    message,
    level: "info",
    data,
  });
}

export { Sentry };
