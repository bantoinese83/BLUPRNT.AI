import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";
import type { InvoiceRow, UserSubscriptionRow } from "@shared/types/database";
import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { extractUploadFailureFromInvokeResult } from "@shared/lib/upload-invoke-result";
import { shouldPromptUpgradeAfterUploadFailure } from "@shared/constants/upload-error-codes";
import { addUserFlowBreadcrumb, reportClientError } from "@/lib/sentry";

interface UseInvoiceManagementProps {
  projectId: string;
  invoices: InvoiceRow[];
  onUploaded: () => void;
  onUpgradeClick: (reason?: "invoice_limit") => void;
  isArchitect: boolean;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
}

const FREE_LIMIT = 3;
const GUIDE_KEY = "bluprnt_invoice_guide_collapsed";

export function useInvoiceManagement({
  projectId,
  invoices,
  onUploaded,
  onUpgradeClick,
  isArchitect,
  subscription,
  hasProjectPass,
}: UseInvoiceManagementProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reviewQueueRef = useRef<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewInvoiceId, setReviewInvoiceId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<
    "invoice" | "quote" | "warranty" | "permit"
  >("invoice");
  const [guideDismissed, setGuideDismissed] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [guideExpanded, setGuideExpanded] = useState(true);

  const invoiceCount = invoices.filter(
    (i) => (i.document_type ?? "invoice") === "invoice",
  ).length;

  const architectUploads = subscription?.invoice_uploads_count ?? 0;
  const isArchitectActive = isArchitect && subscription?.status === "active";

  const atLimit =
    documentType === "invoice" &&
    !hasProjectPass &&
    ((!isArchitectActive && invoiceCount >= FREE_LIMIT) ||
      (isArchitectActive && architectUploads >= 10));

  const isArchitectAtGlobalLimit = isArchitectActive && architectUploads >= 10;

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (
      typeParam === "quote" ||
      typeParam === "warranty" ||
      typeParam === "permit"
    ) {
      setDocumentType(typeParam);
      const next = new URLSearchParams(searchParams);
      next.delete("type");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const dismissGuide = () => {
    try {
      localStorage.setItem(GUIDE_KEY, "1");
    } catch {
      /* ignore */
    }
    setGuideDismissed(true);
  };

  const closeReviewModal = useCallback(() => {
    setReviewInvoiceId(null);
    const next = reviewQueueRef.current.shift();
    if (next) {
      setTimeout(() => setReviewInvoiceId(next), 80);
    }
  }, []);

  const handleUploadFile = async (files: FileList | null) => {
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

    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error(
        "Unsupported file type. Please upload a PDF, JPEG, PNG, or WEBP.",
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError(null);
    setUploading(true);
    addUserFlowBreadcrumb("invoice_upload_started", {
      document_type: documentType,
    });
    try {
      const fd = new FormData();
      fd.set("project_id", projectId);
      fd.set("file", file);
      fd.set("document_type", documentType);
      const { data, error: fnErr } = await invokeFunction<{
        invoice_id?: string;
        ocr_status?: string;
        error?: string;
        error_code?: string;
      }>("upload-invoice", { body: fd });

      const failure = extractUploadFailureFromInvokeResult(data, fnErr);
      if (failure) {
        addUserFlowBreadcrumb("invoice_upload_failed", {
          document_type: documentType,
          error_code: failure.errorCode ?? "unknown",
        });
        if (
          shouldPromptUpgradeAfterUploadFailure(
            failure.errorCode,
            failure.message,
          )
        ) {
          onUpgradeClick("invoice_limit");
        }
        setError(failure.message);
        return;
      }

      dismissGuide();
      onUploaded();
      const newId = data?.invoice_id;
      if (newId && documentType === "invoice") {
        setReviewInvoiceId((prev) => {
          if (prev) {
            reviewQueueRef.current.push(newId);
            return prev;
          }
          return newId;
        });
      }
      toast.success(
        `${documentType === "invoice" ? "Invoice" : "Document"} uploaded successfully`,
      );
      addUserFlowBreadcrumb("invoice_upload_succeeded", {
        document_type: documentType,
        opens_review: Boolean(newId && documentType === "invoice"),
      });
    } catch (err: unknown) {
      reportClientError("invoice_upload", err);
      addUserFlowBreadcrumb("invoice_upload_exception", {
        document_type: documentType,
      });
      const msg = friendlyDocumentUploadError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openFileUpload = () => {
    if (atLimit) {
      onUpgradeClick("invoice_limit");
      return;
    }
    inputRef.current?.click();
  };

  return {
    inputRef,
    uploading,
    error,
    reviewInvoiceId,
    setReviewInvoiceId,
    closeReviewModal,
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
  };
}
