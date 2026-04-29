import { FileText, ExternalLink, Receipt } from "lucide-react";
import { money } from "@/lib/formatters";
import type { LedgerEntryWithLines } from "@shared/types/database";

interface ReconciledDocumentsListProps {
  scopeItemId: string;
  ledgerEntries: LedgerEntryWithLines[];
}

export function ReconciledDocumentsList({
  scopeItemId,
  ledgerEntries,
}: ReconciledDocumentsListProps) {
  // Find all line items across all documents that match this scope item
  const matchedLines = ledgerEntries.flatMap((doc) =>
    (doc.ledger_line_items || [])
      .filter((line) => line.scope_item_id === scopeItemId)
      .map((line) => ({
        ...line,
        docVendor: doc.vendor_name,
        docId: doc.id,
        docType: doc.document_type,
        docDate: doc.issue_date,
      })),
  );

  if (matchedLines.length === 0) return null;

  return (
    <div className="mt-4 p-5 rounded-2xl bg-emerald-50/30 border border-emerald-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-2">
        <Receipt className="w-4 h-4 text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/80">
          Reconciled Spend
        </span>
      </div>

      <div className="space-y-2.5">
        {matchedLines.map((line, i) => (
          <div
            key={`${line.docId}-${i}`}
            className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white border border-emerald-100/50 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-slate-900 truncate">
                    {line.category || "General Line Item"}
                  </p>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
                    {line.docType || "Document"}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 truncate">
                  {line.docVendor} •{" "}
                  {line.docDate
                    ? new Date(line.docDate).toLocaleDateString()
                    : "No date"}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-emerald-700 tabular-nums">
                {money(line.line_total || 0)}
              </p>
              <button
                type="button"
                className="text-[9px] font-bold text-slate-400 hover:text-teal-600 flex items-center gap-1 ml-auto"
                onClick={() => {
                  // This would ideally open the document review modal
                  window.dispatchEvent(
                    new CustomEvent("open-document-review", {
                      detail: { documentId: line.docId },
                    }),
                  );
                }}
              >
                View
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 flex items-center justify-center">
        <p className="text-[9px] text-emerald-600/50 font-bold uppercase tracking-widest">
          Verified against project archive
        </p>
      </div>
    </div>
  );
}
