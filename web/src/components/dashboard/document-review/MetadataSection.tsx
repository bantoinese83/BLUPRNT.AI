import { Calendar } from "lucide-react";
import { ledgerDocumentSelectOptions } from "@shared/lib/ledger-document-pickers";
import type { LedgerDocumentType } from "@shared/lib/infer-document-type";
import {
  ledgerReviewAmountFieldMode,
  ledgerReviewDateFieldsForType,
  ledgerReviewSummaryHint,
  ledgerReviewSummaryPlaceholder,
  ledgerReviewTotalAmountHint,
  ledgerReviewTotalAmountLabel,
  type LedgerReviewDateFieldKey,
} from "@shared/lib/document-review-form-config";
import { GlossaryTerm } from "@/components/ui/GlossaryTerm";

const DOC_TYPE_GLOSSARY: Partial<Record<LedgerDocumentType, string>> = {
  warranty: "warranty",
  insurance: "coi",
  permit: "permit",
  contract: "change-order",
  appraisal: "appraisal",
};

interface MetadataSectionProps {
  ledgerDocType: LedgerDocumentType;
  onDocTypeChange: (type: LedgerDocumentType) => void;
  reviewDates: Record<LedgerReviewDateFieldKey, string>;
  onReviewDateChange: (key: LedgerReviewDateFieldKey, value: string) => void;
  vendorName: string;
  onVendorNameChange: (name: string) => void;
  aiSummary: string;
  onAiSummaryChange: (summary: string) => void;
  totalValue?: string;
  onTotalValueChange?: (total: string) => void;
  vendorLabel?: string;
}

export function MetadataSection({
  ledgerDocType,
  onDocTypeChange,
  reviewDates,
  onReviewDateChange,
  vendorName,
  onVendorNameChange,
  aiSummary,
  onAiSummaryChange,
  totalValue,
  onTotalValueChange,
  vendorLabel = "Vendor Name",
}: MetadataSectionProps) {
  const amountMode = ledgerReviewAmountFieldMode(ledgerDocType);
  const totalLabel = ledgerReviewTotalAmountLabel(ledgerDocType);
  const totalHint = ledgerReviewTotalAmountHint(ledgerDocType);
  const summaryPlaceholder = ledgerReviewSummaryPlaceholder(ledgerDocType);
  const summaryHint = ledgerReviewSummaryHint(ledgerDocType);
  const dateFields = ledgerReviewDateFieldsForType(ledgerDocType);
  const glossaryId = DOC_TYPE_GLOSSARY[ledgerDocType];

  return (
    <div className="flex-1 w-full space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 space-y-1.5">
        <label
          htmlFor="document-review-vendor-name"
          className="text-xs font-semibold text-slate-600 uppercase tracking-wide"
        >
          {vendorLabel}
        </label>
        <input
          id="document-review-vendor-name"
          type="text"
          value={vendorName}
          onChange={(e) => onVendorNameChange(e.target.value)}
          placeholder="e.g. Home Depot, ACME Roofing"
          className="w-full text-sm font-medium rounded-lg border border-slate-300 bg-white px-2 py-2"
        />
        <p className="text-[11px] text-slate-500 leading-snug">
          The company or issuer named on the document. Correct if necessary.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 space-y-1.5">
        <label
          htmlFor="document-review-doc-type"
          className="text-xs font-semibold text-slate-600 uppercase tracking-wide"
        >
          Document type
        </label>
        <select
          id="document-review-doc-type"
          value={ledgerDocType}
          onChange={(e) =>
            onDocTypeChange(e.target.value as LedgerDocumentType)
          }
          className="w-full text-sm font-medium rounded-lg border border-slate-300 bg-white px-2 py-2"
        >
          {ledgerDocumentSelectOptions().map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 leading-snug">
          Fix a misclassification here — no need to re-upload. This updates your
          ledger and seller packet grouping.
          {glossaryId ? (
            <>
              {" "}
              <GlossaryTerm termId={glossaryId}>What's this?</GlossaryTerm>
            </>
          ) : null}
        </p>
      </div>

      {amountMode !== "hidden" && totalLabel ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 space-y-1.5">
          <label
            htmlFor="document-review-total"
            className="text-xs font-semibold text-slate-600 uppercase tracking-wide"
          >
            {totalLabel}
          </label>
          <input
            id="document-review-total"
            type="text"
            inputMode="decimal"
            value={totalValue}
            onChange={(e) => onTotalValueChange?.(e.target.value)}
            placeholder="0.00"
            className="w-full text-sm font-medium rounded-lg border border-slate-300 bg-white px-2 py-2"
          />
          <p className="text-[11px] text-slate-500 leading-snug">{totalHint}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 space-y-1.5">
        <label
          htmlFor="document-review-ai-summary"
          className="text-xs font-semibold text-slate-600 uppercase tracking-wide"
        >
          Document summary
        </label>
        <textarea
          id="document-review-ai-summary"
          rows={3}
          value={aiSummary}
          onChange={(e) => onAiSummaryChange(e.target.value)}
          placeholder={summaryPlaceholder}
          className="w-full text-sm font-medium rounded-lg border border-slate-300 bg-white px-2 py-2 resize-none"
        />
        <p className="text-[11px] text-slate-500 leading-snug">{summaryHint}</p>
      </div>

      {dateFields.map((field) => {
        const inputId = `document-review-date-${field.key}`;
        return (
          <div
            key={field.key}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 space-y-1.5"
          >
            <label
              htmlFor={inputId}
              className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5"
            >
              <Calendar className="w-3 h-3" aria-hidden />
              {field.label}
            </label>
            <input
              id={inputId}
              type="date"
              value={reviewDates[field.key]}
              onChange={(e) => onReviewDateChange(field.key, e.target.value)}
              className="w-full text-sm font-medium rounded-lg border border-slate-300 bg-white px-2 py-2"
            />
            <p className="text-[11px] text-slate-500 leading-snug">
              {field.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}
