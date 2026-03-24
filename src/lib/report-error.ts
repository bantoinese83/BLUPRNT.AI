/**
 * Structured client-side error line for production debugging and support (correlate with user reports via eventId).
 */
export function reportClientError(
  source: string,
  error: Error,
  extra?: Record<string, unknown>,
): string {
  const eventId = crypto.randomUUID();
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
