import * as Sentry from "@sentry/react";

/**
 * Structured client-side error line for production debugging and support (correlate with user reports via eventId).
 */
export function reportClientError(
  source: string,
  error: Error,
  extra?: Record<string, unknown>,
): string {
  if (Sentry.getClient()) {
    Sentry.captureException(error, { tags: { source }, extra });
  }

  const eventId = Sentry.getClient()
    ? (Sentry.lastEventId() ?? crypto.randomUUID())
    : crypto.randomUUID();
  const line = {
    ts: new Date().toISOString(),
    level: "error" as const,
    source,
    eventId,
    message: error.message,
    stack: error.stack,
    ...extra,
  };
  console.error(JSON.stringify(line));
  return eventId;
}
