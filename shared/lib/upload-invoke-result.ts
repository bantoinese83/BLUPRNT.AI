import { friendlyDocumentUploadError } from "./user-friendly-errors";

export type UploadFailureBody = {
  error?: string;
  error_code?: string;
};

/**
 * Parses Edge Function JSON from `supabase.functions.invoke` when the response
 * is non-OK or the body includes `{ error }` (behavior varies by client version).
 */
export function extractUploadFailureFromInvokeResult(
  data: unknown,
  error: unknown,
): { message: string; errorCode?: string } | null {
  if (data && typeof data === "object" && data !== null) {
    const d = data as UploadFailureBody;
    if (d.error) {
      return {
        message: friendlyDocumentUploadError(null, { error: d.error }),
        errorCode: d.error_code,
      };
    }
  }

  if (!error) return null;

  if (typeof error === "object" && error !== null) {
    const e = error as {
      message?: string;
      context?: { body?: unknown };
    };
    const rawBody = e.context?.body;
    if (rawBody != null) {
      try {
        const parsed =
          typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
        if (
          parsed &&
          typeof parsed === "object" &&
          "error" in parsed &&
          parsed.error
        ) {
          return {
            message: friendlyDocumentUploadError(null, {
              error: String((parsed as UploadFailureBody).error),
            }),
            errorCode: (parsed as UploadFailureBody).error_code,
          };
        }
      } catch {
        /* ignore */
      }
    }
  }

  return {
    message: friendlyDocumentUploadError(error),
  };
}
