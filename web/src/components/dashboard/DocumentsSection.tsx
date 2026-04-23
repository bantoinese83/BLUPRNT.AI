import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDocumentManagement } from "@/hooks/useDocumentManagement";
import { DocumentUploadHeader } from "./DocumentUploadHeader";
import { DocumentGuide } from "./DocumentGuide";
import { DocumentLimitAlert } from "./DocumentLimitAlert";
import { DocumentCard } from "./DocumentCard";
import { DocumentReviewModal } from "./DocumentReviewModal";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Upload } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardEmptyPanel } from "@/components/ui/dashboard-empty-panel";
import type { InvoiceRow, UserSubscriptionRow } from "@shared/types/database";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import {
  filterInvoicesByLedgerDocumentFilter,
  type LedgerDocumentFilter,
} from "@/lib/plan-vs-actual";

type DocumentsSectionProps = {
  projectId: string;
  documents: InvoiceRow[];
  onUploaded: (id?: string) => void;
  onUpgradeClick: (reason?: "invoice_limit") => void;
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
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const wasUploading = useRef(false);
  const [dropActive, setDropActive] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<LedgerDocumentFilter>("all");

  const visibleDocuments = useMemo(
    () => filterInvoicesByLedgerDocumentFilter(documents, ledgerFilter),
    [documents, ledgerFilter],
  );

  const {
    inputRef,
    uploading,
    batchStatus,
    error,
    reviewInvoiceId: reviewDocumentId,
    setReviewInvoiceId: setReviewDocumentId,
    closeReviewModal,
    guideDismissed,
    guideExpanded,
    setGuideExpanded,
    invoiceCount: documentCount,
    atLimit,
    blockInvoiceOnlyUpload,
    isArchitectAtGlobalLimit,
    dismissGuide,
    handleUploadFile,
    openFileUpload,
    FREE_LIMIT,
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

  const dropDisabled = uploading || blockInvoiceOnlyUpload;
  const isArchitectActive = isArchitectPlanEffective(subscription ?? null);

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (dropDisabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDropActive(true);
    },
    [dropDisabled],
  );

  const onDragLeave = useCallback((e: React.DragEvent) => {
    const next = e.relatedTarget as Node | null;
    if (next && dropZoneRef.current?.contains(next)) return;
    setDropActive(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDropActive(false);
      if (dropDisabled) return;
      const files = e.dataTransfer.files;
      if (files?.length) void handleUploadFile(files);
    },
    [dropDisabled, handleUploadFile],
  );

  return (
    <div
      ref={scrollRef}
      id="document-upload-anchor"
      className="space-y-5 scroll-mt-24"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleUploadFile(e.target.files)}
        multiple
      />

      <div
        ref={dropZoneRef}
        role="region"
        aria-label="Document upload"
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "space-y-5 rounded-2xl transition-[box-shadow,background-color,border-color] duration-200",
          dropActive &&
            !dropDisabled &&
            "bg-teal-50/40 ring-2 ring-teal-400/80 ring-offset-2 ring-offset-slate-50",
        )}
      >
        <DocumentUploadHeader
          uploading={uploading}
          batchStatus={batchStatus}
          onUploadClick={openFileUpload}
        />

        {!dropDisabled && (
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400 -mt-2 sm:-mt-1">
            Or drop multiple PDFs or photos here
          </p>
        )}

        {documents.length === 0 && !guideDismissed && (
          <DocumentGuide
            expanded={guideExpanded}
            setExpanded={setGuideExpanded}
            onUploadClick={openFileUpload}
            onDismiss={dismissGuide}
            disabled={uploading || blockInvoiceOnlyUpload}
          />
        )}

        {error && (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
            {error}
          </p>
        )}

        {documents.length > 0 ? (
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter ledger documents"
          >
            {(
              [
                { id: "all" as const, label: "All" },
                { id: "capital" as const, label: "Spending" },
                { id: "maintenance" as const, label: "Logs & Certs" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={ledgerFilter === id}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                  ledgerFilter === id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
                onClick={() => setLedgerFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {documents.length > 0 && visibleDocuments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-800">
              {ledgerFilter === "capital"
                ? "No invoices, quotes, or receipts in this view"
                : "No permits, logs, or other project records here yet"}
            </p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {ledgerFilter === "capital"
                ? "Switch to All or Logs & Certs, or upload a spending document (invoice, quote, or receipt)."
                : "Upload warranties, liens, inspections, insurance, HOA letters, and more — they show here and in your archive."}
            </p>
          </div>
        ) : null}

        {!isArchitectActive &&
          !hasProjectPass &&
          documentCount > 0 &&
          documentCount < FREE_LIMIT && (
            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="font-medium text-slate-700">
                {documentCount} of {FREE_LIMIT} free spending document uploads
                used on this project (quotes &amp; other records don&apos;t
                count).
              </span>{" "}
              <button
                type="button"
                className="text-slate-900 font-bold hover:underline"
                onClick={() => onUpgradeClick()}
              >
                See plans
              </button>
            </p>
          )}

        {atLimit && (
          <DocumentLimitAlert
            isArchitectAtGlobalLimit={isArchitectAtGlobalLimit}
            freeLimit={FREE_LIMIT}
            onUpgradeClick={onUpgradeClick}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {uploading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <Card className="border-slate-200 bg-slate-50/50 border-dashed animate-pulse h-[100px]">
                <CardContent className="p-4 flex items-center space-x-4 h-full">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </CardContent>
              </Card>
              <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                  {batchStatus || "AI Reading..."}
                </span>
              </div>
            </motion.div>
          )}

          {documents.length === 0 && !uploading && (
            <div className="sm:col-span-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60">
              <DashboardEmptyPanel
                density="compact"
                icon={FileText}
                title="No documents yet"
                description={
                  <>
                    <strong className="text-slate-700">Next step:</strong>{" "}
                    Upload an invoice, quote, or other record. After upload,
                    we&apos;ll open it so you can review and organize.
                  </>
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openFileUpload}
                    disabled={uploading || blockInvoiceOnlyUpload}
                    type="button"
                    className="gap-2 rounded-xl"
                  >
                    <Upload className="w-4 h-4" />
                    Upload documents
                  </Button>
                }
              />
            </div>
          )}

          {visibleDocuments.map((doc, idx) => (
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

          {documents.length > 0 && visibleDocuments.length > 0 && (
            <button
              type="button"
              className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 hover:bg-slate-50/80 hover:border-slate-300 transition-all min-h-[140px]"
              onClick={openFileUpload}
              disabled={uploading || blockInvoiceOnlyUpload}
            >
              <Upload className="w-6 h-6 mb-2 text-slate-400" />
              <span className="text-sm font-medium">Add more</span>
              <span className="text-xs">Select multiple files</span>
            </button>
          )}
        </div>
      </div>

      {reviewDocumentId && (
        <DocumentReviewModal
          documentId={reviewDocumentId}
          projectId={projectId}
          onClose={closeReviewModal}
          onSaved={onUploaded}
        />
      )}
    </div>
  );
}
