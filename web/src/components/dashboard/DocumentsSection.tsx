import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDocumentManagement } from "@/hooks/useDocumentManagement";
import { DocumentGuide } from "./DocumentGuide";
import { DocumentLimitAlert } from "./DocumentLimitAlert";
import { DocumentCard } from "./DocumentCard";
import { DocumentReviewModal } from "./DocumentReviewModal";
import { FileText, Upload, Plus } from "lucide-react";
import { DashboardEmptyPanel } from "@/components/ui/dashboard-empty-panel";
import type {
  LedgerEntryRow,
  UserSubscriptionRow,
} from "@shared/types/database";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import {
  filterLedgerEntriesByDocumentFilter,
  type LedgerDocumentFilter,
} from "@/lib/plan-vs-actual";
import { LEDGER_UPLOAD_ANCHOR_ID } from "@shared/constants/ui";
import { Button } from "@/components/ui/button";

import { DocumentFilters } from "./documents/DocumentFilters";
import { DocumentDropZone } from "./documents/DocumentDropZone";

type DocumentsSectionProps = {
  projectId: string;
  documents: LedgerEntryRow[];
  onUploaded: (id?: string) => void;
  onUpgradeClick: (reason?: "ledger_limit") => void;
  subscription?: UserSubscriptionRow | null;
  hasProjectPass?: boolean;
};

export function DocumentsSection({
  projectId,
  documents,
  onUploaded,
  onUpgradeClick,
  subscription = null,
  hasProjectPass = false,
}: DocumentsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasUploading = useRef(false);

  const [dropActive, setDropActive] = useState(false);
  const [limit, setLimit] = useState(8);
  const [ledgerFilter, setLedgerFilter] = useState<LedgerDocumentFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleDocuments = useMemo(() => {
    let filtered = filterLedgerEntriesByDocumentFilter(documents, ledgerFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((doc) => {
        const hay = [
          doc.vendor_name,
          doc.document_type,
          doc.ai_summary,
          doc.invoice_number,
          doc.payment_status,
          doc.issue_date,
          doc.currency,
          doc.warranty_expiry_date,
          doc.due_date,
          doc.total != null ? String(doc.total) : "",
          doc.subtotal != null ? String(doc.subtotal) : "",
          doc.tax_total != null ? String(doc.tax_total) : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return filtered;
  }, [documents, ledgerFilter, searchQuery]);

  const {
    inputRef,
    uploading,
    error,
    reviewDocumentId,
    setReviewDocumentId,
    closeReviewModal,
    guideDismissed,
    guideExpanded,
    setGuideExpanded,
    blockRecordOnlyUpload,
    atLimit,
    isArchitectAtGlobalLimit,
    FREE_LIMIT,
    dismissGuide,
    handleUploadFile,
    openFileUpload,
  } = useDocumentManagement({
    projectId,
    documents,
    onUploaded,
    onUpgradeClick,
    subscription,
    hasProjectPass,
  });

  useEffect(() => {
    if (wasUploading.current && !uploading && documents.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    wasUploading.current = uploading;
  }, [uploading, documents.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        document.getElementById("document-search-input")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isArchitectActive = isArchitectPlanEffective(subscription ?? null);

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (uploading || blockRecordOnlyUpload) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDropActive(true);
    },
    [uploading, blockRecordOnlyUpload],
  );

  const onDragLeave = useCallback(() => {
    setDropActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (uploading || blockRecordOnlyUpload) return;
      e.preventDefault();
      setDropActive(false);
      const files = e.dataTransfer.files;
      if (files?.length) void handleUploadFile(files);
    },
    [handleUploadFile, uploading, blockRecordOnlyUpload],
  );

  return (
    <div id={LEDGER_UPLOAD_ANCHOR_ID} className="space-y-8 scroll-mt-24">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files) void handleUploadFile(files);
        }}
        multiple
      />
      {/* Header & Search */}
      <DocumentFilters
        ledgerFilter={ledgerFilter}
        setLedgerFilter={setLedgerFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {atLimit && (
        <DocumentLimitAlert
          isArchitectAtGlobalLimit={isArchitectAtGlobalLimit}
          freeLimit={FREE_LIMIT}
          onUpgradeClick={onUpgradeClick}
        />
      )}

      {documents.length === 0 && !uploading ? (
        <DocumentDropZone
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          dropActive={dropActive}
          uploading={uploading}
          blockRecordOnlyUpload={blockRecordOnlyUpload}
          openFileUpload={openFileUpload}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div ref={scrollRef} className="contents" />

          {visibleDocuments.length === 0 && !uploading ? (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 py-12">
              <DashboardEmptyPanel
                icon={FileText}
                title="No matching documents"
                description={
                  searchQuery
                    ? `We couldn't find any documents matching "${searchQuery}".`
                    : "No documents found for the selected filter."
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFileUpload}
                    disabled={uploading || blockRecordOnlyUpload}
                    type="button"
                    className="gap-2 rounded-xl"
                  >
                    <Upload className="w-4 h-4" />
                    Upload documents
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {uploading && (
                <div className="relative border-2 border-dashed border-teal-200 rounded-2xl bg-teal-50/30 p-6 flex flex-col items-center justify-center text-center animate-pulse min-h-[140px]">
                  <Upload className="w-6 h-6 mb-2 text-teal-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-teal-600">
                    AI Reading...
                  </span>
                </div>
              )}

              {visibleDocuments.slice(0, limit).map((doc, idx) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  index={idx}
                  isArchitect={isArchitectActive}
                  hasProjectPass={hasProjectPass}
                  onUpgradeClick={() => onUpgradeClick()}
                  onClick={(id) => setReviewDocumentId(id)}
                />
              ))}

              {visibleDocuments.length > limit && (
                <button
                  type="button"
                  onClick={() => setLimit(visibleDocuments.length)}
                  className="sm:col-span-2 py-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors group"
                >
                  <span>Show all {visibleDocuments.length} documents</span>
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-teal-50 transition-colors">
                    <Plus className="w-3 h-3" />
                  </div>
                </button>
              )}

              <button
                type="button"
                className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 hover:bg-slate-50/80 hover:border-slate-300 transition-all min-h-[140px]"
                onClick={openFileUpload}
                disabled={uploading || blockRecordOnlyUpload}
              >
                <Upload className="w-6 h-6 mb-2 text-slate-400" />
                <span className="text-sm font-medium">Add more</span>
                <span className="text-xs">Select multiple files</span>
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 uppercase tracking-widest text-center animate-shake">
          {error}
        </div>
      )}

      {!guideDismissed && documents.length > 0 && (
        <DocumentGuide
          expanded={guideExpanded}
          setExpanded={setGuideExpanded}
          onUploadClick={openFileUpload}
          onDismiss={dismissGuide}
        />
      )}

      {reviewDocumentId && (
        <DocumentReviewModal
          documentId={reviewDocumentId}
          projectId={projectId}
          onClose={closeReviewModal}
          onSaved={onUploaded}
          onDeleted={() => onUploaded(projectId)}
        />
      )}
    </div>
  );
}
