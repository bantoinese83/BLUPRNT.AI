import { captureEdgeException } from "./sentry.ts";

/**
 * One JSON line per log event for grep-friendly Edge logs (e.g. Cloud dashboards).
 * Errors are also reported to Sentry when SENTRY_DSN is configured.
 */
export function logEdge(
  level: "info" | "warn" | "error",
  message: string,
  context?: Record<string, unknown>,
): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    const err =
      context?.error instanceof Error
        ? context.error
        : context?.detail != null
        ? new Error(`${message}: ${String(context.detail)}`)
        : new Error(message);
    captureEdgeException(err, {
      tags: {
        edge_log: "true",
        ...(typeof context?.function === "string"
          ? { function: context.function }
          : {}),
      },
      extra: context,
      fingerprint: [message],
    });
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
