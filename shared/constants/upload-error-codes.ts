/**
 * Stable codes returned by `upload-document` (403/401 JSON body) so clients
 * don’t rely on substring-matching user-facing strings.
 */
export const UPLOAD_ERROR_CODES = {
  LEDGER_LIMIT_FREE_PROJECT: "LEDGER_LIMIT_FREE_PROJECT",
  LEDGER_LIMIT_ARCHITECT_MONTH: "LEDGER_LIMIT_ARCHITECT_MONTH",
  ARCHITECT_LIMIT_REACHED: "ARCHITECT_LIMIT_REACHED",
  SESSION_REQUIRED: "SESSION_REQUIRED",
} as const;

export type UploadErrorCode =
  (typeof UPLOAD_ERROR_CODES)[keyof typeof UPLOAD_ERROR_CODES];

export function isLedgerUploadLimitCode(code: string | undefined): boolean {
  return (
    code === UPLOAD_ERROR_CODES.LEDGER_LIMIT_FREE_PROJECT ||
    code === UPLOAD_ERROR_CODES.LEDGER_LIMIT_ARCHITECT_MONTH ||
    code === UPLOAD_ERROR_CODES.ARCHITECT_LIMIT_REACHED
  );
}

/** Prefer `error_code`; fall back to message heuristics for older server responses. */
export function shouldPromptUpgradeAfterUploadFailure(
  code: string | undefined,
  message: string | undefined,
): boolean {
  if (isLedgerUploadLimitCode(code)) return true;
  if (!message) return false;
  return /limit reached|Upgrade for more|global uploads|Free tier limit|Architect plan limit/i.test(
    message,
  );
}
