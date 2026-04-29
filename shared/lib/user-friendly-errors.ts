/**
 * Plain-language copy for auth, uploads, and API failures (no raw stack traces).
 */

const matches = (haystack: string, needles: string[]) =>
  needles.some((n) => haystack.toLowerCase().includes(n.toLowerCase()));

export function friendlyAuthError(message: string, status?: number): string {
  const m = (message || "").trim();
  if (!m) return "Something went wrong. Please try again.";

  const rules: [string[], string][] = [
    [
      [
        "invalid login credentials",
        "invalid_credentials",
        "invalid email or password",
      ],
      "That email or password doesn’t match our records. Try again or use Forgot password.",
    ],
    [
      ["email not confirmed", "email_not_confirmed", "email not verified"],
      "Confirm your email from the link we sent, then sign in.",
    ],
    [
      [
        "too many requests",
        "rate limit",
        "over_email_send_rate_limit",
        "over_request_rate",
        "rate_limit_exceeded",
      ],
      "Too many attempts. Wait a minute, then try again.",
    ],
    [
      [
        "user already registered",
        "already registered",
        "already been registered",
        "user_already_exists",
      ],
      "That email already has an account. Try signing in instead.",
    ],
    [
      ["signup_disabled", "signups not allowed"],
      "New sign-ups aren’t available right now. Try again later.",
    ],
    [
      ["network", "failed to fetch", "network request failed", "load failed"],
      "Check your internet connection and try again.",
    ],
    [
      [
        "invalid otp",
        "token has expired",
        "invalid refresh token",
        "refresh_token_not_found",
      ],
      "That link or code expired. Request a new one and try again.",
    ],
  ];

  for (const [needles, friendly] of rules) {
    if (matches(m, needles)) return friendly;
  }

  if (status === 400 && matches(m, ["invalid", "bad request"])) {
    return "We couldn’t complete that request. Check what you entered and try again.";
  }
  if (m.length > 200 || /jwt|sqlstate|postgres|exception|undefined/i.test(m)) {
    return "Something went wrong. Please try again.";
  }
  return m;
}

/**
 * Decode `?error=` from auth redirects (web query string or Expo Router params).
 * Returns null if missing/empty; otherwise passes through {@link friendlyAuthError}.
 */
export function friendlyAuthErrorFromUrlParam(
  encoded: string | string[] | null | undefined,
): string | null {
  const raw = Array.isArray(encoded) ? encoded[0] : encoded;
  if (raw == null || typeof raw !== "string" || !raw.trim()) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    decoded = raw.trim();
  }
  return friendlyAuthError(decoded);
}

/** Edge function / upload failures (web + mobile). */
export function friendlyDocumentUploadError(
  err?: unknown,
  body?: { error?: string },
): string {
  const fromErr =
    typeof err === "object" && err && "message" in err
      ? String((err as { message?: string }).message ?? "")
      : "";
  const raw = (body?.error ?? fromErr).trim();
  if (!raw)
    return "That didn’t go through. Check your connection and try again—or try a smaller PDF or image.";

  if (
    matches(raw, [
      "Free plan",
      "Free limit",
      "10 invoice",
      "Architect plan",
      "Upload limit reached",
      "Upgrade",
    ])
  ) {
    return raw;
  }

  const rules: [string[], string][] = [
    [
      ["file must be under", "10mb", "10 mb", "too large"],
      "That file is too large. Use a file under 10 MB.",
    ],
    [
      ["unsupported file", "invalid file type", "mime type", "heic"],
      "That file type isn’t supported. Use a PDF or a photo (JPEG, PNG, WebP, or HEIC).",
    ],
    [
      ["empty file", "0 bytes"],
      "That file appears to be empty. Try choosing it again or snap a new photo.",
    ],
    [
      ["too many requests", "try again later", "rate limit"],
      "You’re sending files quickly. Wait a moment, then try again.",
    ],
    [
      ["sign in to upload", "session_required"],
      "Please sign in again, then try your upload.",
    ],
    [
      ["project not found"],
      "We couldn’t find that project. Open it again from your list, then upload.",
    ],
    [
      ["403", "access denied", "could not store file", "quota exceeded"],
      "We couldn’t save that file. Check your connection—or try a smaller PDF or photo.",
    ],
    [
      ["401", "unauthorized"],
      "Your session expired. Sign in again, then try uploading.",
    ],
    [
      ["version mismatch", "api version"],
      "An update is required. Please update your app to the latest version to continue.",
    ],
    [
      ["gemini", "ai error", "ocr failed", "extraction"],
      "AI extraction is taking longer than usual. The file is uploaded; check your vault in a few minutes.",
    ],
    [
      ["network", "failed to fetch", "network request failed"],
      "Check your internet connection and try again.",
    ],
  ];

  for (const [needles, friendly] of rules) {
    if (matches(raw, needles)) return friendly;
  }

  return "That didn’t go through. Check your connection and try again—or try a smaller PDF or image.";
}

/** Postgrest / Supabase client errors from table updates (rename, etc.). */
export function friendlyPostgrestMutationError(err: unknown): string {
  if (!err || typeof err !== "object")
    return "Something went wrong. Please try again.";
  const e = err as { message?: string; code?: string };
  const m = e.message || "";
  if (
    e.code === "PGRST301" ||
    matches(m, ["jwt", "permission denied", "not authorized"])
  ) {
    return "Your session may have expired. Sign out, sign in again, then try once more.";
  }
  if (matches(m, ["network", "failed to fetch"]))
    return "Check your internet connection and try again.";
  return "We couldn’t complete that. Try again in a moment.";
}

export function friendlyProjectShareError(
  message?: string,
  code?: string,
): string {
  const m = message || "";
  if (matches(m, ["network", "failed to fetch"]))
    return "Check your internet connection and try again.";
  if (
    code === "42501" ||
    matches(m, ["permission", "policy", "row-level security", "rls"])
  ) {
    return "We couldn’t create a share link. Sign in again if needed, then try once more.";
  }
  return "We couldn’t create a share link right now. Try again in a moment.";
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unexpected error occurred.";
}
