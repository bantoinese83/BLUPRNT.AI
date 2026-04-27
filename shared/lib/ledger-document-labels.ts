import {
  coerceLedgerDocumentType,
  type LedgerDocumentType,
} from "./infer-document-type.ts";

/** Human-readable label for chips, lists, toasts, and pickers. */
export function ledgerDocumentTypeLabel(t: string | null | undefined): string {
  const v = (t ?? "invoice").toLowerCase().trim();
  const map: Record<string, string> = {
    invoice: "Invoice / bill",
    quote: "Quote / estimate",
    receipt: "Receipt",
    warranty: "Warranty",
    permit: "Permit / CO",
    maintenance: "Maintenance log",
    contract: "Contract / agreement",
    insurance: "Insurance (COI, policy, claim)",
    inspection: "Inspection report",
    appraisal: "Appraisal",
    hoa: "HOA / ARC approval",
    lien_waiver: "Lien waiver / release",
    manual: "Manual / spec sheet",
    energy: "Energy / HERS / rating",
    disclosure: "Disclosure (lead, safety, etc.)",
    other: "Other / uncategorized",
  };
  return map[v] ?? v.replace(/_/g, " ");
}

/**
 * Primary heading for the document review modal.
 */
export function reviewDocumentModalTitle(t: string | null | undefined): string {
  const v = coerceLedgerDocumentType(t);
  const titles: Record<string, string> = {
    invoice: "Review bill or invoice",
    quote: "Review quote or estimate",
    receipt: "Review receipt",
    warranty: "Review warranty or registration",
    permit: "Review permit or approval",
    maintenance: "Review maintenance log",
    contract: "Review contract or agreement",
    insurance: "Review insurance document",
    inspection: "Review inspection report",
    appraisal: "Review appraisal",
    hoa: "Review HOA or ARC document",
    lien_waiver: "Review lien waiver or release",
    manual: "Review manual or spec sheet",
    energy: "Review energy or rating document",
    disclosure: "Review disclosure",
    other: "Review document",
  };
  return titles[v] ?? "Review document";
}

/**
 * @deprecated use isPlanVsActualDocumentType from infer-document-type — same behavior.
 * Line-to-budget linking: invoices, quotes, receipts only.
 */
export { isCapitalLedgerDocumentType } from "./infer-document-type.ts";

/** Card / row styling: spend docs vs. warranty+maintenance vs. other records. */
export function ledgerDocumentVisualGroup(
  t: string | null | undefined,
): "spend" | "warranty_care" | "archive" {
  const v = coerceLedgerDocumentType(t);
  if (v === "invoice" || v === "quote" || v === "receipt") return "spend";
  if (v === "warranty" || v === "maintenance") return "warranty_care";
  return "archive";
}

/** Default vendor/label line when the upload pipeline has no hint or OCR. */
export function defaultVendorNameForDocumentType(
  v: LedgerDocumentType,
): string {
  const m: Record<LedgerDocumentType, string> = {
    invoice: "Vendor",
    quote: "Quote",
    receipt: "Receipt",
    warranty: "Warranty",
    permit: "Permit",
    maintenance: "Maintenance log",
    contract: "Contract",
    insurance: "Insurance",
    inspection: "Inspection",
    appraisal: "Appraisal",
    hoa: "HOA / association",
    lien_waiver: "Lien waiver",
    manual: "Product manual / specs",
    energy: "Energy / rating",
    disclosure: "Disclosure",
    other: "Document",
  };
  return m[v] ?? "Document";
}

export function defaultLineDescriptionForUpload(
  docType: LedgerDocumentType,
  vendorHint: string | null | undefined,
): string {
  const v = (vendorHint || "").trim();
  if (docType === "maintenance") {
    return v ? `Log — ${v}` : "Maintenance log entry";
  }
  if (docType === "invoice" || docType === "quote" || docType === "receipt") {
    if (v) return `Services or purchase — ${v}`;
    if (docType === "receipt") return "Receipt line";
    return "Invoice line";
  }
  if (v) return `Record — ${v}`;
  return "Recorded line";
}
/** Theme colors and visual hints for the review modal based on type. */
export function ledgerDocumentTheme(t: string | null | undefined): {
  bg: string;
  icon: string;
  border: string;
  glow: string;
  label: string;
} {
  const vg = ledgerDocumentVisualGroup(t);
  if (vg === "spend") {
    return {
      bg: "bg-rose-50/50",
      icon: "text-rose-600",
      border: "border-rose-100",
      glow: "shadow-rose-100/50",
      label: "Vendor Name",
    };
  }
  if (vg === "warranty_care") {
    return {
      bg: "bg-teal-50/50",
      icon: "text-teal-600",
      border: "border-teal-100",
      glow: "shadow-teal-100/50",
      label: "Brand / Provider",
    };
  }
  return {
    bg: "bg-slate-50/50",
    icon: "text-slate-600",
    border: "border-slate-100",
    glow: "shadow-slate-100/50",
    label: "Issuer / Category",
  };
}
