import { type LedgerDocumentType } from "./infer-document-type";
import { ledgerDocumentTypeLabel } from "./ledger-document-labels";

/** Consistent order for review modals and mobile pickers (capital / common first). */
export const LEDGER_DOCUMENT_PICKER_ORDER: LedgerDocumentType[] = [
  "invoice",
  "quote",
  "receipt",
  "warranty",
  "permit",
  "maintenance",
  "contract",
  "insurance",
  "inspection",
  "appraisal",
  "hoa",
  "lien_waiver",
  "manual",
  "energy",
  "disclosure",
  "other",
];

export function ledgerDocumentSelectOptions(): {
  value: LedgerDocumentType;
  label: string;
}[] {
  return LEDGER_DOCUMENT_PICKER_ORDER.map((value) => ({
    value,
    label: ledgerDocumentTypeLabel(value),
  }));
}
