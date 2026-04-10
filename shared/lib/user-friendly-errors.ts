/**
 * Plain-language copy for auth, uploads, and API failures (no raw stack traces).
 */

export function friendlyAuthError(message: string, status?: number): string {
  const m = (message || "").trim();
  const lower = m.toLowerCase();
  if (!m) {
    return "Something went wrong. Please try again.";
  }
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "That email or password doesn’t match our records. Try again or use Forgot password.";
  }
  if (
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed")
  ) {
    return "Confirm your email from the link we sent, then sign in.";
  }
  if (
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("over_request_rate")
  ) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("already been registered")
  ) {
    return "That email already has an account. Try signing in instead.";
  }
  if (
    lower.includes("signup_disabled") ||
    lower.includes("signups not allowed")
  ) {
    return "New sign-ups aren’t available right now. Try again later.";
  }
  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("network request failed")
  ) {
    return "Check your internet connection and try again.";
  }
  if (lower.includes("invalid otp") || lower.includes("token has expired")) {
    return "That link or code expired. Request a new one and try again.";
  }
  if (
    status === 400 &&
    (lower.includes("invalid") || lower.includes("bad request"))
  ) {
    return "We couldn’t complete that request. Check what you entered and try again.";
  }
  if (m.length > 200 || /jwt|sqlstate|postgres|exception|undefined/i.test(m)) {
    return "Something went wrong. Please try again.";
  }
  return m;
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
  const msg = raw;
  const lower = msg.toLowerCase();

  if (
    msg &&
    (msg.includes("Free plan") ||
      msg.includes("Free limit") ||
      msg.includes("10 invoice") ||
      msg.includes("Architect plan") ||
      msg.includes("Upload limit reached") ||
      (msg.includes("Upgrade") && msg.includes("limit")))
  ) {
    return msg;
  }

  if (
    lower.includes("file must be under") ||
    lower.includes("10mb") ||
    lower.includes("10 mb")
  ) {
    return "That file is too large. Use a file under 10 MB.";
  }
  if (
    lower.includes("unsupported file") ||
    (lower.includes("pdf") &&
      lower.includes("jpeg") &&
      lower.includes("upload"))
  ) {
    return "That file type isn’t supported. Use a PDF or a photo (JPEG, PNG, or WebP).";
  }
  if (
    lower.includes("too many requests") ||
    lower.includes("try again later")
  ) {
    return "You’re sending files quickly. Wait a moment, then try again.";
  }
  if (lower.includes("sign in to upload")) {
    return "Please sign in again, then try your upload.";
  }
  if (lower.includes("project not found")) {
    return "We couldn’t find that project. Open it again from your list, then upload.";
  }
  if (
    msg.includes("403") ||
    lower.includes("access denied") ||
    lower.includes("could not store file")
  ) {
    return "We couldn’t save that file. Check your connection—or try a smaller PDF or photo.";
  }
  if (msg.includes("401") || lower.includes("unauthorized")) {
    return "Your session expired. Sign in again, then try uploading.";
  }
  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("network request failed")
  ) {
    return "Check your internet connection and try again.";
  }

  return "That didn’t go through. Check your connection and try again—or try a smaller PDF or image.";
}

export function friendlyProjectShareError(
  message?: string,
  code?: string,
): string {
  const m = (message || "").toLowerCase();
  const c = code || "";
  if (m.includes("network") || m.includes("failed to fetch")) {
    return "Check your internet connection and try again.";
  }
  if (
    c === "42501" ||
    m.includes("permission") ||
    m.includes("policy") ||
    m.includes("row-level security") ||
    m.includes("rls")
  ) {
    return "We couldn’t create a share link. Sign in again if needed, then try once more.";
  }
  return "We couldn’t create a share link right now. Try again in a moment.";
}
