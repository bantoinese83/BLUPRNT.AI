import { useState, useEffect, useCallback } from "react";
import { Loader2, Link2, FileSearch } from "lucide-react";
import { DocumentThumbnail } from "@/components/dashboard/DocumentThumbnail";
import { Button } from "@/components/ui/button";

import {
  isCapitalLedgerDocumentType,
  reviewDocumentModalTitle,
  ledgerDocumentTheme,
} from "@shared/lib/ledger-document-labels";
import { reviewModalIconForDocumentType } from "@/lib/ledger-type-icons";
import { OriginalUploadPreviewModal } from "@/components/dashboard/OriginalUploadPreviewModal";
import { ModalFocusSurface } from "@/components/ui/modal-dialog";

// Sub-components
import { ReviewModalHeader } from "./document-review/ReviewModalHeader";
import { MetadataSection } from "./document-review/MetadataSection";
import { LineItemCard } from "./document-review/LineItemCard";
import { DocumentReviewStatus } from "./document-review/DocumentReviewStatus";
import { DocumentReviewTotal } from "./document-review/DocumentReviewTotal";
import { DocumentReviewActions } from "./document-review/DocumentReviewActions";
import { DeleteConfirmationModal } from "./document-review/DeleteConfirmationModal";
import { AuditTrailRow } from "./document-review/AuditTrailRow";

import { useDocumentReviewDetail } from "@/hooks/useDocumentReviewDetail";

export function DocumentReviewModal({
  documentId,
  projectId,
  onClose,
  onSaved,
  onDeleted,
}: {
  documentId: string;
  projectId: string;
  onClose: () => void;
  onSaved?: (id?: string) => void;
  onDeleted?: (id: string) => void;
}) {
  const {
    loading,
    error,
    document,
    scopeItems,
    mappings,
    setMappings,
    saving,
    deleting,
    ledgerDocType,
    setLedgerDocType,
    reviewDates,
    setReviewDateField,
    vendorName,
    setVendorName,
    aiSummary,
    setAiSummary,
    totalValue,
    setTotalValue,
    handleSaveMappings,
    handleDelete,
  } = useDocumentReviewDetail(documentId, projectId, onSaved, onClose);

  const [originalPreviewOpen, setOriginalPreviewOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isUnverified = document?.is_verified === false;

  // Keyboard shortcut: Cmd/Ctrl + Enter to Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSaveMappings();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveMappings]);

  const doDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    const success = await handleDelete();
    if (success && document) {
      setShowDeleteConfirm(false);
      onDeleted?.(document.id);
      onClose();
    }
  }, [handleDelete, document, onDeleted, onClose]);

  if (loading) {
    return (
      <ModalFocusSurface
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/50"
        ariaLabel="Loading document review"
        onEscape={onClose}
      >
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />

          <p className="text-slate-600">Loading document…</p>
        </div>
      </ModalFocusSurface>
    );
  }

  if (error || !document) {
    return (
      <ModalFocusSurface
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/50"
        ariaLabel="Document review error"
        onEscape={onClose}
      >
        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            {error ??
              "We couldn’t open this document. Close and try again from your list."}
          </p>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </ModalFocusSurface>
    );
  }

  const showCapitalLineLink = isCapitalLedgerDocumentType(ledgerDocType);
  const theme = ledgerDocumentTheme(ledgerDocType);

  const isProcessing =
    !document.vendor_name ||
    document.vendor_name === "Vendor" ||
    document.vendor_name === "Document" ||
    document.vendor_name === "Processing...";

  return (
    <>
      <ModalFocusSurface
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/50 overflow-y-auto"
        titleId="document-review-title"
        onEscape={onClose}
        active={!originalPreviewOpen && !showDeleteConfirm}
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <ReviewModalHeader
            title={reviewDocumentModalTitle(ledgerDocType)}
            isUnverified={document.is_verified === false}
            headerIconClass={theme.icon}
            HeaderIcon={reviewModalIconForDocumentType(ledgerDocType)}
            bgClass={theme.bg}
            onClose={onClose}
          />

          <div className="p-4 space-y-4">
            {isUnverified ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <FileSearch className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">
                    Review and Verify
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {showCapitalLineLink ? (
                      <>
                        This data was extracted by AI. Please confirm the
                        vendor, totals, and line links before verifying. Once
                        saved, this becomes a verified record in your ledger.
                      </>
                    ) : (
                      <>
                        This data was extracted by AI. Please confirm the issuer
                        name, document type, and summary before verifying. Once
                        saved, this becomes a verified record in your ledger.
                      </>
                    )}
                  </p>
                </div>
              </div>
            ) : showCapitalLineLink ? (
              <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <strong className="text-slate-800">Tip:</strong> Match each line
                to your estimate below so you can see what&apos;s on or off
                budget.
              </p>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {document.id && (
                <DocumentThumbnail
                  ledgerEntryId={document.id}
                  size="lg"
                  className="w-full sm:w-32 sm:h-32 rounded-2xl shadow-drop-md border-slate-200"
                />
              )}
              <div className="flex-1 w-full space-y-4">
                {document.document_id ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto gap-2 rounded-xl"
                    onClick={() => setOriginalPreviewOpen(true)}
                  >
                    <Link2 className="w-4 h-4" aria-hidden />
                    View original upload
                  </Button>
                ) : null}

                <MetadataSection
                  ledgerDocType={ledgerDocType}
                  onDocTypeChange={setLedgerDocType}
                  reviewDates={reviewDates}
                  onReviewDateChange={setReviewDateField}
                  vendorName={vendorName}
                  onVendorNameChange={setVendorName}
                  aiSummary={aiSummary}
                  onAiSummaryChange={setAiSummary}
                  totalValue={totalValue}
                  onTotalValueChange={setTotalValue}
                  vendorLabel={theme.label}
                />
                <AuditTrailRow
                  isVerified={document.is_verified}
                  createdAt={document.created_at}
                  updatedAt={document.updated_at}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <DocumentReviewStatus
                vendorName={document.vendor_name || ""}
                isProcessing={isProcessing}
                showCapitalLineLink={showCapitalLineLink}
                paymentStatus={document.payment_status || "unknown"}
                ledgerDocType={ledgerDocType}
                aiSummary={aiSummary}
              />

              {showCapitalLineLink && (
                <DocumentReviewTotal
                  total={document.total ?? 0}
                  isProcessing={isProcessing}
                />
              )}
            </div>

            {showCapitalLineLink ? (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Link to budget line (optional)
                </h5>
                <p className="text-xs text-slate-500">
                  Link document lines to your budget breakdown to track actual
                  vs. estimate.
                </p>
                {document.line_items.map((line) => (
                  <LineItemCard
                    key={line.id}
                    line={line}
                    mapping={mappings[line.id]}
                    scopeItems={scopeItems}
                    onMappingChange={(lineId, scopeItemId) =>
                      setMappings((m) => ({ ...m, [lineId]: scopeItemId }))
                    }
                  />
                ))}
              </div>
            ) : null}

            <DocumentReviewActions
              onDelete={doDelete}
              onCancel={onClose}
              onSave={handleSaveMappings}
              isSaving={saving}
              isDeleting={deleting}
              isProcessing={isProcessing}
              isUnverified={isUnverified}
            />
          </div>
        </div>
      </ModalFocusSurface>

      {originalPreviewOpen ? (
        <OriginalUploadPreviewModal
          key={documentId}
          ledgerEntryId={documentId}
          onClose={() => setOriginalPreviewOpen(false)}
        />
      ) : null}

      {showDeleteConfirm && (
        <DeleteConfirmationModal
          ledgerDocType={ledgerDocType}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          isDeleting={deleting}
        />
      )}
    </>
  );
}
