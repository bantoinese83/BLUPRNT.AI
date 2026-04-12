import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

function scrubSensitive(input: string): string {
  return input
    .replace(/\bBearer\s+[\w-]+\.[\w-]+\.[\w-]+\b/gi, "Bearer [redacted]")
    .replace(/\beyJ[\w-]*\.eyJ[\w-]*\.[\w-]*\b/g, "[jwt]");
}

let initialized = false;

function initBrowserSentry(): void {
  if (initialized || !dsn || typeof window === "undefined") {
    return;
  }
  initialized = true;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
    // Tracing (session replay disabled: requires explicit consent in many jurisdictions)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    beforeSend(event) {
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

export function captureEdgeInvokeFailure(
  functionName: string,
  error: unknown,
): void {
  if (!dsn || !initialized) {
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

// Initialize immediately
initBrowserSentry();
