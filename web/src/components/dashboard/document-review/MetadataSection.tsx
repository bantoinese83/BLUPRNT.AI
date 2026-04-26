import { Calendar } from "lucide-react";
import { ledgerDocumentSelectOptions } from "@shared/lib/ledger-document-pickers";
import type { LedgerDocumentType } from "@shared/lib/infer-document-type";

interface MetadataSectionProps {
  ledgerDocType: LedgerDocumentType;
  onDocTypeChange: (type: LedgerDocumentType) => void;
  warrantyExpiryDate: string;
  onWarrantyDateChange: (date: string) => void;
}

export function MetadataSection({
  ledgerDocType,
  onDocTypeChange,
  warrantyExpiryDate,
  onWarrantyDateChange,
}: MetadataSectionProps) {
  return (
    <div className="flex-1 w-full space-y-4">
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
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 space-y-1.5">
        <label
          htmlFor="document-review-warranty-expiry"
          className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5"
        >
          <Calendar className="w-3 h-3" />
          Warranty Expiration
        </label>
        <input
          id="document-review-warranty-expiry"
          type="date"
          value={warrantyExpiryDate}
          onChange={(e) => onWarrantyDateChange(e.target.value)}
          className="w-full text-sm font-medium rounded-lg border border-slate-300 bg-white px-2 py-2"
        />
        <p className="text-[11px] text-slate-500 leading-snug">
          Optional. We'll notify you 30 days before this date.
        </p>
      </div>
    </div>
  );
}
