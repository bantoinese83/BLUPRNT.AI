import { useInvoiceManagement } from "@/hooks/useInvoiceManagement";
import { InvoiceUploadHeader } from "./InvoiceUploadHeader";
import { InvoiceGuide } from "./InvoiceGuide";
import { InvoiceLimitAlert } from "./InvoiceLimitAlert";
import { InvoiceCard } from "./InvoiceCard";
import { InvoiceReviewModal } from "./InvoiceReviewModal";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Upload } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { InvoiceRow, UserSubscriptionRow } from "@/types/database";

type InvoicesSectionProps = {
  projectId: string;
  invoices: InvoiceRow[];
  onUploaded: () => void;
  onUpgradeClick: (reason?: "invoice_limit") => void;
  isArchitect?: boolean;
  subscription?: UserSubscriptionRow | null;
  hasProjectPass?: boolean;
};

export function InvoicesSection({
  projectId,
  invoices,
  onUploaded,
  onUpgradeClick,
  isArchitect = false,
  subscription = null,
  hasProjectPass = false,
}: InvoicesSectionProps) {
  const {
    inputRef,
    uploading,
    error,
    reviewInvoiceId,
    setReviewInvoiceId,
    documentType,
    setDocumentType,
    guideDismissed,
    guideExpanded,
    setGuideExpanded,
    invoiceCount,
    atLimit,
    isArchitectAtGlobalLimit,
    dismissGuide,
    handleUploadFile,
    openFileUpload,
    FREE_LIMIT,
  } = useInvoiceManagement({
    projectId,
    invoices,
    onUploaded,
    onUpgradeClick,
    isArchitect,
    subscription,
    hasProjectPass,
  });

  return (
    <div id="invoice-upload-anchor" className="space-y-5 scroll-mt-24">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleUploadFile(e.target.files)}
      />

      <InvoiceUploadHeader
        uploading={uploading}
        documentType={documentType}
        setDocumentType={setDocumentType}
        onUploadClick={openFileUpload}
      />

      {invoices.length === 0 && !guideDismissed && (
        <InvoiceGuide
          expanded={guideExpanded}
          setExpanded={setGuideExpanded}
          onUploadClick={openFileUpload}
          onDismiss={dismissGuide}
          disabled={uploading}
          atLimit={atLimit}
        />
      )}

      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
          {error}
        </p>
      )}

      {documentType === "invoice" &&
        !isArchitect &&
        !hasProjectPass &&
        invoiceCount > 0 &&
        invoiceCount < FREE_LIMIT && (
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <span className="font-medium text-slate-700">
              {invoiceCount} of {FREE_LIMIT} free invoices used on this project.
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
        <InvoiceLimitAlert
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
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                AI Reading...
              </span>
            </div>
          </motion.div>
        )}

        {invoices.length === 0 && !uploading && (
          <div className="sm:col-span-2 flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-1">
              No documents yet
            </h4>
            <p className="text-sm text-slate-500 mb-5 max-w-sm">
              <strong className="text-slate-700">Next step:</strong> Upload an
              invoice or quote. After upload, we&apos;ll open it so you can line
              items up with your estimate.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={openFileUpload}
              disabled={uploading || atLimit}
              type="button"
              className="gap-2 rounded-xl"
            >
              <Upload className="w-4 h-4" />
              Upload your first document
            </Button>
          </div>
        )}

        {invoices.map((inv, idx) => (
          <InvoiceCard
            key={inv.id}
            invoice={inv}
            index={idx}
            onClick={(id) => setReviewInvoiceId(id)}
          />
        ))}

        {invoices.length > 0 && (
          <button
            type="button"
            className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 hover:bg-slate-50/80 hover:border-slate-300 transition-all min-h-[140px]"
            onClick={openFileUpload}
            disabled={uploading || atLimit}
          >
            <Upload className="w-6 h-6 mb-2 text-slate-400" />
            <span className="text-sm font-medium">Add another</span>
            <span className="text-xs">PDF or image</span>
          </button>
        )}
      </div>

      {reviewInvoiceId && (
        <InvoiceReviewModal
          invoiceId={reviewInvoiceId}
          projectId={projectId}
          onClose={() => setReviewInvoiceId(null)}
          onSaved={onUploaded}
        />
      )}
    </div>
  );
}
