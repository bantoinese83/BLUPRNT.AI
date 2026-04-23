/**
 * All supported ledger document types for homeowner / renovation / resale use.
 * - **Capital (plan vs. actual):** invoice, quote, receipt — dollar tracking & budget line link.
 * - **Records & compliance:** everything else (warranties, permits, contracts, liens, etc.).
 */

export const LEDGER_DOCUMENT_TYPES = [
  // Plan vs. actual — bills & pricing
  "invoice",
  "quote",
  "receipt",
  // Jurisdiction & property rules
  "permit",
  "hoa",
  // Warranties, care, products
  "warranty",
  "maintenance",
  "manual",
  // Insurance & risk
  "insurance",
  "disclosure",
  // Quality & value
  "inspection",
  "appraisal",
  "energy",
  // Money & legal
  "contract",
  "lien_waiver",
  // Catch-all
  "other",
] as const;

export type LedgerDocumentType = (typeof LEDGER_DOCUMENT_TYPES)[number];

const TYPE_SET = new Set<string>(LEDGER_DOCUMENT_TYPES);

/** Types that count toward project spend in plan vs. actual (invoices, quotes, receipts). */
export const LEDGER_PLAN_VS_ACTUAL_TYPES = [
  "invoice",
  "quote",
  "receipt",
] as const;

function normalizedLedgerTypeKey(value: string | null | undefined): string {
  const s = (
    value == null || String(value).trim() === "" ? "invoice" : String(value)
  )
    .toLowerCase()
    .trim();
  return s;
}

export function isPlanVsActualDocumentType(
  value: string | null | undefined,
): boolean {
  const v = normalizedLedgerTypeKey(value);
  return v === "invoice" || v === "quote" || v === "receipt";
}

/**
 * Eligible for invoice-style OCR and budget line → scope_item linking.
 * Same as plan-vs-actual spend types.
 */
export function isCapitalLedgerDocumentType(
  value: string | null | undefined,
): boolean {
  return isPlanVsActualDocumentType(value);
}

/** Normalize DB/API values to a supported ledger document type. */
export function coerceLedgerDocumentType(
  value: string | null | undefined,
): LedgerDocumentType {
  const v = (value ?? "").toLowerCase().trim();
  if (v && TYPE_SET.has(v)) {
    return v as LedgerDocumentType;
  }
  if (!v) {
    return "invoice";
  }
  return "other";
}

/**
 * Best-effort class from the original filename (before upload renames).
 * Returns null when unclear — callers should use vision/AI or "other".
 */
export function inferDocumentTypeFromFilename(
  name: string,
): LedgerDocumentType | null {
  const raw = (name || "").toLowerCase();
  const compact = raw.replace(/[^a-z0-9]+/g, " ");

  if (
    /\b(hoa|hoa approval|architectural review|arc submission|condo|townhome|association|covenant|deed restrict)\b/.test(
      compact,
    )
  ) {
    return "hoa";
  }
  if (
    /\b(lien waiver|waiver and release|final waiver|unconditional waiver|progress waiver|lien release|contractor waiver)\b/.test(
      compact,
    )
  ) {
    return "lien_waiver";
  }
  if (
    /\b(appraisal|appraised|fmv|as is value|valuation report)\b/.test(compact)
  ) {
    return "appraisal";
  }
  if (
    /\b(hers|rated home|blower door|energy star|rescheck|home energy|bees score|energy cert)\b/.test(
      compact,
    )
  ) {
    return "energy";
  }
  if (
    /\b(insurance|coi|certificate of insurance|policy dec|claim|loss report|acord|general liability|workers comp)\b/.test(
      compact,
    )
  ) {
    return "insurance";
  }
  if (
    /\b(home inspection|property inspection|buyer inspection|pre purchase|4 point|4point|full inspection|inspection report)\b/.test(
      compact,
    ) ||
    (/\binspection\b/.test(compact) &&
      /\b(home|property|full|pre)\b/.test(compact))
  ) {
    return "inspection";
  }
  if (
    /\b(disclosure|lead paint|material disclosure|sellers disclosure|radon|asbestos|tila|hazard)\b/.test(
      compact,
    )
  ) {
    return "disclosure";
  }
  if (
    /\b(manual|spec sheet|user guide|installation guide|cut sheet|datasheet|model no)\b/.test(
      compact,
    )
  ) {
    return "manual";
  }
  if (
    /\b(permitting|coho|certificate of occupancy|building permit|zoning|plan check|plan review|right of way|row permit|demo permit|electrical permit|plumbing permit|mechanical permit|city permit|county permit)\b/.test(
      compact,
    ) ||
    (/\bpermit\b/.test(compact) && !/\bhome inspection\b/.test(raw))
  ) {
    return "permit";
  }
  if (
    /\b(maintenance log|maintenance-log|service log|upkeep log|homeowner log|house log|care log|property log|task log)\b/.test(
      compact,
    ) ||
    (/\bmaintenance\b/.test(compact) && /\blog\b/.test(compact))
  ) {
    return "maintenance";
  }
  if (
    /\b(warranty|guarantee|registration card|product registration|extended service|protection plan|serial)\b/.test(
      compact,
    )
  ) {
    return "warranty";
  }
  if (
    /\b(contract|agreement|sow|scope of work|subcontract|retainer|milestone|aia|g701)\b/.test(
      compact,
    )
  ) {
    return "contract";
  }
  if (
    /\b(quote|estimate|proposal|bid|rfq|tender|change order|budget breakdown)\b/.test(
      compact,
    )
  ) {
    return "quote";
  }
  if (
    /\b(receipt|proof of purchase|return receipt|paid in full|pos receipt|store receipt)\b/.test(
      compact,
    )
  ) {
    return "receipt";
  }
  if (
    /\b(invoice|bill to|amount due|purchase order|p\s*o\b|cc auth|credit card slip|sales slip|vendor bill)\b/.test(
      compact,
    )
  ) {
    return "invoice";
  }
  return null;
}

export function isInvoiceStyleOcrType(docType: LedgerDocumentType): boolean {
  return docType === "invoice" || docType === "receipt";
}

export function isArchitectQuotaInvoiceType(docType: string): boolean {
  const t = normalizedLedgerTypeKey(docType);
  return t === "invoice" || t === "receipt";
}

/** `document_type` form values for upload-invoice (includes `auto` for auto-detect). */
export const UPLOAD_FORM_DOCUMENT_TYPES = [
  ...LEDGER_DOCUMENT_TYPES,
  "auto",
] as const;

export type UploadFormDocumentType =
  (typeof UPLOAD_FORM_DOCUMENT_TYPES)[number];
