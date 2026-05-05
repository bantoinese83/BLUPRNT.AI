import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || "";

function scrubSensitive(input: string): string {
  return input
    .replace(/\bBearer\s+[\w-]+\.[\w-]+\.[\w-]+\b/gi, "Bearer [redacted]")
    .replace(/\beyJ[\w-]*\.eyJ[\w-]*\.[\w-]*\b/g, "[jwt]");
}

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
      const combined =
        event.exception?.values
          ?.map((v) => `${v.type ?? ""}: ${v.value ?? ""}`)
          .join(" | ") ?? "";
      if (/camera not available|simulator.*camera/i.test(combined)) {
        return null;
      }
      if (event.request?.headers) {
        const h = { ...event.request.headers };
        if (h.Authorization) h.Authorization = "[redacted]";
        event.request.headers = h;
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => {
          if (typeof b.message === "string") {
            return { ...b, message: scrubSensitive(b.message) };
          }
          return b;
        });
      }
      if (event.exception?.values) {
        for (const ex of event.exception.values) {
          if (ex.value) ex.value = scrubSensitive(ex.value);
        }
      }
      return event;
    },
  });
}

/**
 * Surfaces unexpected client errors in dev (always) and in Sentry when configured.
 * Use for catch blocks that still show friendly UI — avoids silent production failures.
 * Returns a unique event ID for user reference.
 */
export function reportClientError(
  scope: string,
  error: unknown,
  extra?: Record<string, unknown>,
): string {
  const err =
    error instanceof Error ? error : new Error(`${scope}: ${String(error)}`);

  if (initialized) {
    Sentry.captureException(err, { tags: { client_flow: scope }, extra });
  }

  const eventId = initialized
    ? (Sentry.lastEventId() ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)))
    : typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  // Structured log for local debugging and log aggregation
  const line = {
    ts: new Date().toISOString(),
    level: "error" as const,
    source: scope,
    eventId,
    message: err.message,
    stack: err.stack,
    ...extra,
  };
  console.error(JSON.stringify(line));

  return String(eventId);
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
