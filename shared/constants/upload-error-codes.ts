/**
 * Stable codes returned by `upload-document` (403/401 JSON body) so clients
 * don’t rely on substring-matching user-facing strings.
 */
export const UPLOAD_ERROR_CODES = {
  INVOICE_LIMIT_FREE_PROJECT: "INVOICE_LIMIT_FREE_PROJECT",
  INVOICE_LIMIT_ARCHITECT_MONTH: "INVOICE_LIMIT_ARCHITECT_MONTH",
  SESSION_REQUIRED: "SESSION_REQUIRED",
} as const;

export type UploadErrorCode =
  (typeof UPLOAD_ERROR_CODES)[keyof typeof UPLOAD_ERROR_CODES];

export function isInvoiceUploadLimitCode(code: string | undefined): boolean {
  return (
    code === UPLOAD_ERROR_CODES.INVOICE_LIMIT_FREE_PROJECT ||
    code === UPLOAD_ERROR_CODES.INVOICE_LIMIT_ARCHITECT_MONTH
  );
}

/** Prefer `error_code`; fall back to message heuristics for older server responses. */
export function shouldPromptUpgradeAfterUploadFailure(
  code: string | undefined,
  message: string | undefined,
): boolean {
  if (isInvoiceUploadLimitCode(code)) return true;
  if (!message) return false;
  return /limit reached|Upgrade for more|global uploads|Free tier limit|Architect plan limit/i.test(
    message,
  );
}
