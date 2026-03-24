import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, Loader2, ChevronDown, ChevronUp, ScanLine } from "lucide-react";
import { UpgradeIcon } from "@/components/ui/UpgradeIcon";
import { Badge } from "@/components/ui/badge";

import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";
import { InvoiceReviewModal } from "./InvoiceReviewModal";

import type { InvoiceRow } from "@/types/database";

type InvoicesSectionProps = {
  projectId: string;
  invoices: InvoiceRow[];
  onUploaded: () => void;
  /** Pass invoice_limit when user hit the 3-invoice cap so the upgrade modal can explain. */
  onUpgradeClick: (reason?: "invoice_limit") => void;
};

const FREE_LIMIT = 3;
const GUIDE_KEY = "bluprnt_invoice_guide_collapsed";

function friendlyUploadError(err: unknown, body?: { error?: string }): string {
  const msg = body?.error ?? (typeof err === "object" && err && "message" in err ? String((err as { message?: string }).message) : "");
  if (msg.includes("Free limit") || msg.includes("10 invoice") || msg.includes("Architect plan")) {
    return msg;
  }
  if (msg.includes("403") || msg.toLowerCase().includes("access denied")) {
    return "We couldn’t verify access to this project. Refresh the page and try again.";
  }
  if (msg.includes("401")) {
    return "Your session expired. Sign in again, then try uploading.";
  }
  return "That didn’t go through. Check your connection and try again—or try a smaller PDF or image.";
}

export function InvoicesSection({
  projectId,
  invoices,
  onUploaded,
  onUpgradeClick,
}: InvoicesSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewInvoiceId, setReviewInvoiceId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<"invoice" | "quote" | "warranty" | "permit">("invoice");
  const [guideDismissed, setGuideDismissed] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [guideExpanded, setGuideExpanded] = useState(true);
  const invoiceCount = invoices.filter((i) => (i.document_type ?? "invoice") === "invoice").length;
  const atLimit = documentType === "invoice" && invoiceCount >= FREE_LIMIT;

  const typeParam = searchParams.get("type");
  useEffect(() => {
    if (typeParam === "quote" || typeParam === "warranty" || typeParam === "permit") {
      setDocumentType(typeParam);
      setSearchParams({}, { replace: true });
    }
  }, [typeParam, setSearchParams]);

  function dismissGuide() {
    try {
      localStorage.setItem(GUIDE_KEY, "1");
    } catch {
      /* ignore */
    }
    setGuideDismissed(true);
  }

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (atLimit) {
      onUpgradeClick("invoice_limit");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Please upload a file smaller than 10MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload a PDF, JPEG, PNG, or WEBP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("project_id", projectId);
      fd.set("file", file);
      fd.set("document_type", documentType);
      const { data, error: fnErr } = await supabase.functions.invoke<{
        invoice_id?: string;
        ocr_status?: string;
        error?: string;
      }>("upload-invoice", { body: fd });
      if (fnErr) {
        setError(friendlyUploadError(fnErr, data ?? undefined));
        return;
      }
      if (data && "error" in data && data.error) {
        const e = String(data.error);
        if (e.includes("Free limit") || e.includes("10 invoice") || e.includes("Upgrade")) {
          onUpgradeClick("invoice_limit");
        }
        setError(e.includes("limit") || e.includes("Architect") ? e : friendlyUploadError(null, data));
        return;
      }
      dismissGuide();
      onUploaded();
      const newId = data?.invoice_id;
      if (newId && documentType === "invoice") {
        setTimeout(() => setReviewInvoiceId(newId), 100);
      }
      toast.success(`${documentType === 'invoice' ? 'Invoice' : 'Document'} uploaded successfully`);
    } catch {
      setError(friendlyUploadError(null));
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function openUpload() {
    if (atLimit) {
      onUpgradeClick("invoice_limit");
      return;
    }
    inputRef.current?.click();
  }

  return (
    <div id="invoice-upload-anchor" className="space-y-5 scroll-mt-24">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onFile(e.target.files)}
      />
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          Invoices & documents
        </h3>
        <div className="flex items-center gap-2 relative">
          <AnimatePresence>
            {uploading && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute -left-36 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-900 text-xs font-bold overflow-hidden whitespace-nowrap"
              >
                <div className="relative">
                  <ScanLine className="w-4 h-4 animate-pulse" />
                  <motion.div 
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-x-0 top-0 h-0.5 bg-slate-950 shadow-[0_0_8px_black]"
                  />
                </div>
                <span>AI READING...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as "invoice" | "quote" | "warranty" | "permit")}
            className="text-sm rounded-xl border border-slate-200 px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-slate-950/20 focus:border-slate-950"
            aria-label="Document type"
          >
            <option value="invoice">Invoice</option>
            <option value="quote">Quote</option>
            <option value="warranty">Warranty</option>
            <option value="permit">Permit</option>
          </select>
          <Button
            variant="outline"
            size="default"
            onClick={openUpload}
            disabled={uploading}
            type="button"
            className={uploading ? 'bg-slate-50 border-slate-200' : ''}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-slate-900" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            {uploading ? 'Processing' : 'Upload'}
          </Button>
        </div>
      </div>

      {invoices.length === 0 && !guideDismissed && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-3">
          <button
            type="button"
            onClick={() => setGuideExpanded((e) => !e)}
            className="flex items-center justify-between w-full text-left font-semibold text-slate-950 gap-2"
          >
            <span className="flex items-center gap-2">
              <UpgradeIcon className="w-5 h-5 opacity-70 shrink-0" aria-hidden />
              First upload? Quick guide
            </span>
            {guideExpanded ? <ChevronUp className="w-5 h-5 shrink-0" /> : <ChevronDown className="w-5 h-5 shrink-0" />}
          </button>

          {guideExpanded && (
            <>
              <ol className="text-sm text-slate-900/90 space-y-2 list-decimal list-inside pl-1">
                <li>
                  <strong>Pick a type</strong> above (invoice, quote, warranty, or permit).
                </li>
                <li>
                  <strong>Upload</strong> a PDF or photo—we&apos;ll open it next so you can match lines to your estimate.
                </li>
              </ol>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" size="sm" variant="primary" className="rounded-xl" onClick={openUpload} disabled={uploading || atLimit}>
                  Choose file
                </Button>
                <Button type="button" size="sm" variant="ghost" className="text-slate-800" onClick={dismissGuide}>
                  Got it, hide this
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
          {error}
        </p>
      )}
      {documentType === "invoice" && invoiceCount > 0 && invoiceCount < FREE_LIMIT && (
        <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
          <span className="font-medium text-slate-700">{invoiceCount} of {FREE_LIMIT} free invoices used on this project.</span>{" "}
          <button type="button" className="text-slate-900 font-bold hover:underline" onClick={() => onUpgradeClick()}>
            See plans
          </button>
        </p>
      )}
      {atLimit && (
        <div className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-2 leading-relaxed">
          <p>
            You&apos;ve used all <strong>{FREE_LIMIT} free invoices</strong> on this project. Upgrade to add more anytime.
          </p>
          <p className="text-slate-600">
            <strong>Good news:</strong> quotes, warranties, and permits don&apos;t count—switch the dropdown and upload those for free.
          </p>
          <Button type="button" size="sm" variant="primary" className="rounded-xl mt-1" onClick={() => onUpgradeClick("invoice_limit")}>
            See upgrade options
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {invoices.length === 0 && (
          <div className="sm:col-span-2 flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-1">No documents yet</h4>
            <p className="text-sm text-slate-500 mb-5 max-w-sm">
              <strong className="text-slate-700">Next step:</strong> Upload an invoice or quote. After upload, we&apos;ll open it so you can line items up with your estimate.
            </p>
            <Button variant="outline" size="sm" onClick={openUpload} disabled={uploading || atLimit} type="button" className="gap-2 rounded-xl">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload your first document
            </Button>
          </div>
        )}
        {invoices.map((inv, idx) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card
              className="border-slate-200/80 shadow-sm hover:shadow-lg hover:border-slate-400 transition-all cursor-pointer overflow-hidden group relative"
              onClick={() => setReviewInvoiceId(inv.id)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-4 flex items-start space-x-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm truncate group-hover:text-slate-950 transition-colors">
                    {inv.vendor_name ?? "Invoice"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {new Date(inv.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {inv.total != null && (
                    <p className="text-sm font-medium text-slate-800">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(inv.total)}
                    </p>
                  )}
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    <Badge
                      variant="secondary"
                      className={`capitalize text-xs ${(inv.document_type ?? "invoice") !== "invoice" ? "bg-slate-200 text-slate-950 font-bold" : "bg-slate-100 text-slate-700"}`}
                    >
                      {inv.document_type ?? "invoice"}
                    </Badge>
                    {(inv.document_type ?? "invoice") === "invoice" && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 capitalize">
                        {inv.payment_status === "unpaid" ? "Unpaid" : inv.payment_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {invoices.length > 0 && (
          <button
            type="button"
            className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 hover:bg-slate-50/80 hover:border-slate-300 transition-all min-h-[140px]"
            onClick={openUpload}
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
