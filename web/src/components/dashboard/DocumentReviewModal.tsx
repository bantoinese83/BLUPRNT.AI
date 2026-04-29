import { useState, useEffect, useCallback } from "react";
import { Loader2, Link2, Sparkles, Trash2 } from "lucide-react";
import { DocumentThumbnail } from "@/components/dashboard/DocumentThumbnail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  isCapitalLedgerDocumentType,
  reviewDocumentModalTitle,
  ledgerDocumentTheme,
} from "@shared/lib/ledger-document-labels";
import { reviewModalIconForDocumentType } from "@/lib/ledger-type-icons";
import { OriginalUploadPreviewModal } from "@/components/dashboard/OriginalUploadPreviewModal";
import { ModalFocusSurface } from "@/components/ui/modal-dialog";
import { cn } from "@/lib/utils";

// Sub-components
import { ReviewModalHeader } from "./document-review/ReviewModalHeader";
import { MetadataSection } from "./document-review/MetadataSection";
import { LineItemCard } from "./document-review/LineItemCard";

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
    warrantyExpiryDate,
    setWarrantyExpiryDate,
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
                <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">
                    Review and Verify
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This data was extracted by AI. Please confirm the vendor,
                    amounts, and line links before verifying. Once saved, this
                    becomes a verified record in your ledger.
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
                  warrantyExpiryDate={warrantyExpiryDate}
                  onWarrantyDateChange={setWarrantyExpiryDate}
                  vendorName={vendorName}
                  onVendorNameChange={setVendorName}
                  aiSummary={aiSummary}
                  onAiSummaryChange={setAiSummary}
                  totalValue={totalValue}
                  onTotalValueChange={setTotalValue}
                  vendorLabel={theme.label}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-slate-900 flex items-center gap-2">
                  {document.vendor_name &&
                  document.vendor_name !== "Vendor" &&
                  document.vendor_name !== "Document" &&
                  document.vendor_name !== "Processing..." ? (
                    document.vendor_name
                  ) : (
                    <span className="flex items-center gap-2 text-slate-500 italic">
                      <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
                      AI Extracting...
                    </span>
                  )}
                  {isProcessing && showCapitalLineLink && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-teal-700 border-teal-200 bg-teal-50 animate-pulse"
                    >
                      Analyzing Document
                    </Badge>
                  )}
                </h4>
                {showCapitalLineLink && (
                  <>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize",
                        document.payment_status === "unknown" &&
                          ledgerDocType !== "quote" &&
                          "animate-pulse bg-teal-50 text-teal-700",
                      )}
                    >
                      {document.payment_status === "unknown"
                        ? ledgerDocType === "quote"
                          ? "Pending Review"
                          : "Processing..."
                        : document.payment_status}
                    </Badge>

                    {/* AI Summary Section */}
                    {(aiSummary || isProcessing) && (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-teal-50/50 border border-teal-100/50">
                        <Sparkles className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-teal-900 leading-relaxed">
                          {aiSummary ? (
                            aiSummary
                          ) : (
                            <span className="italic text-teal-700 animate-pulse">
                              Analyzing Document...
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
              {showCapitalLineLink && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(document.total ?? 0)}
                  </p>
                  {(!document.total || document.total === 0) && (
                    <p
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        document.vendor_name === "Processing..."
                          ? "text-teal-600/50 italic animate-pulse"
                          : "text-amber-700",
                      )}
                    >
                      {document.vendor_name === "Processing..."
                        ? "Calculating..."
                        : "Verify Total"}
                    </p>
                  )}
                </div>
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

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={doDelete}
                disabled={deleting || saving}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2 order-2 sm:order-1"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </Button>
              <div className="flex-1 flex gap-2 order-1 sm:order-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveMappings}
                  disabled={
                    saving ||
                    deleting ||
                    vendorName === "Processing..." ||
                    vendorName === "Needs Review"
                  }
                  className={cn(
                    "flex-1 gap-2 relative overflow-hidden group",
                    isUnverified &&
                      "bg-amber-600 hover:bg-amber-700 border-amber-700 shadow-amber-200",
                  )}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isUnverified ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      <span className="flex items-center gap-1.5">
                        Verify & Save
                        <kbd className="hidden sm:inline-block text-[10px] font-black bg-amber-800/20 px-1 rounded ml-1">
                          ⌘+Enter
                        </kbd>
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Save changes
                      <kbd className="hidden sm:inline-block text-[10px] font-black bg-slate-800/10 px-1 rounded ml-1">
                        ⌘+Enter
                      </kbd>
                    </span>
                  )}
                </Button>
              </div>
            </div>
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-teal-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Delete this {ledgerDocType}?
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                This will permanently remove the document and all associated
                budget mappings from your project. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-rose-600 hover:bg-rose-700 border-rose-700 shadow-rose-200 rounded-xl gap-2"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
