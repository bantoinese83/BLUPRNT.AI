import type { LedgerDocumentType } from "./infer-document-type.ts";
import { isPlanVsActualDocumentType } from "./infer-document-type.ts";

/** DB columns edited by the document review date pickers (warranty, insurance, permit). */
export type LedgerReviewDateFieldKey =
  | "warranty_expiry_date"
  | "insurance_renewal_date"
  | "permit_expiration_date";

export type LedgerReviewDateFieldDef = {
  key: LedgerReviewDateFieldKey;
  label: string;
  hint: string;
  docTypes: readonly LedgerDocumentType[];
};

export const LEDGER_REVIEW_DATE_FIELDS: LedgerReviewDateFieldDef[] = [
  {
    key: "warranty_expiry_date",
    label: "Warranty expiration",
    hint: "Optional. We'll notify you 30 days before this date.",
    docTypes: ["warranty"],
  },
  {
    key: "insurance_renewal_date",
    label: "Policy renewal date",
    hint: "Optional. Term end or next renewal — useful for COIs and annual policies.",
    docTypes: ["insurance"],
  },
  {
    key: "permit_expiration_date",
    label: "Permit expiration",
    hint: "Optional. Expiry, final inspection, or certificate of occupancy date if listed.",
    docTypes: ["permit"],
  },
];

export function ledgerReviewDateFieldsForType(
  t: LedgerDocumentType,
): LedgerReviewDateFieldDef[] {
  return LEDGER_REVIEW_DATE_FIELDS.filter((f) => f.docTypes.includes(t));
}

/**
 * How the review modal shows dollar fields.
 * - **primary:** invoice / quote / receipt — amounts drive plan vs. actual.
 * - **optional_value:** contract / appraisal — often has a headline number but not spend tracking.
 * - **hidden:** warranties, permits, manuals, etc. — totals are cleared on save.
 */
export type LedgerReviewAmountFieldMode =
  | "primary"
  | "optional_value"
  | "hidden";

export function ledgerReviewAmountFieldMode(
  t: LedgerDocumentType,
): LedgerReviewAmountFieldMode {
  if (isPlanVsActualDocumentType(t)) return "primary";
  if (t === "contract" || t === "appraisal") return "optional_value";
  return "hidden";
}

/** Persisted `ledger_entries.total` — non-monetary types always save as 0 so spend rollups stay correct. */
export function effectiveLedgerEntryTotalForSave(
  docType: LedgerDocumentType,
  totalValueStr: string,
): number {
  if (ledgerReviewAmountFieldMode(docType) === "hidden") return 0;
  return parseFloat(totalValueStr) || 0;
}

export function ledgerReviewTotalAmountLabel(t: LedgerDocumentType): string {
  switch (ledgerReviewAmountFieldMode(t)) {
    case "primary":
      return "Total amount ($)";
    case "optional_value":
      return t === "appraisal"
        ? "Appraised / stated value ($)"
        : "Contract value ($)";
    default:
      return "";
  }
}

export function ledgerReviewTotalAmountHint(t: LedgerDocumentType): string {
  switch (ledgerReviewAmountFieldMode(t)) {
    case "primary":
      return "The total including tax, if shown on the document. Correct if the AI misread it.";
    case "optional_value":
      return "Optional. Add a headline figure if the document shows one — it won’t affect plan vs. actual unless the type is a bill, quote, or receipt.";
    default:
      return "";
  }
}

export function ledgerReviewSummaryPlaceholder(t: LedgerDocumentType): string {
  const m: Record<LedgerDocumentType, string> = {
    invoice: "e.g. Electrical rough-in and panel upgrade — labor and materials",
    quote: "e.g. Cabinet install quote — shaker doors, soft-close hardware",
    receipt: "e.g. Big-box purchase — tile, grout, and supplies",
    warranty: "e.g. HVAC labor & parts warranty — 2 years; serial on unit",
    permit: "e.g. Electrical permit — kitchen remodel, issued City of …",
    maintenance: "e.g. Annual service — furnace cleaning and filter",
    contract: "e.g. Master bath remodel — fixtures, tile, plumbing scope",
    insurance: "e.g. COI — general liability for contractor on file",
    inspection: "e.g. Pre-purchase inspection — roof, electrical findings",
    appraisal: "e.g. Appraisal — as-is value and comps noted",
    hoa: "e.g. ARC approval — paint colors and fence height",
    lien_waiver: "e.g. Final unconditional waiver — paid through date",
    manual: "e.g. Mini-split — model, capacity, refrigerant type",
    energy: "e.g. HERS / blower door — score and rating body",
    disclosure: "e.g. Lead paint disclosure — built before 1978",
    other: "e.g. Brief note on what this document is",
  };
  return m[t] ?? m.other;
}

export function ledgerReviewSummaryHint(t: LedgerDocumentType): string {
  const m: Record<LedgerDocumentType, string> = {
    invoice: "What was billed. Helps AI summaries, seller packet, and search.",
    quote: "What was quoted. Helps compare bids and tie to your budget.",
    receipt:
      "What this receipt proves you paid for. Used for records and warranty support.",
    warranty:
      "What products or workmanship this covers. Used for reminders and resale docs.",
    permit: "What work the permit covers. Useful for disclosures and resale.",
    maintenance: "What service or log entry this documents.",
    contract: "Main scope or milestone from the agreement.",
    insurance: "Policy or coverage note (COI dates, carrier, limits).",
    inspection: "Key findings or scope of the inspection.",
    appraisal: "Valuation context or notable adjustments.",
    hoa: "What the HOA approved or requires.",
    lien_waiver: "What payment or release this documents.",
    manual: "Equipment model and how it relates to your project.",
    energy: "Rating, test, or certificate summary.",
    disclosure: "What hazard or disclosure this documents.",
    other: "Short description for your records and AI context.",
  };
  return m[t] ?? m.other;
}
