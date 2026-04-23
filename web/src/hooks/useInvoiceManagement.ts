import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";
import type { InvoiceRow, UserSubscriptionRow } from "@shared/types/database";
import { extractUploadFailureFromInvokeResult } from "@shared/lib/upload-invoke-result";
import { shouldPromptUpgradeAfterUploadFailure } from "@shared/constants/upload-error-codes";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import { addUserFlowBreadcrumb, reportClientError } from "@/lib/sentry";

interface UseInvoiceManagementProps {
  projectId: string;
  invoices: InvoiceRow[];
  onUploaded: (id?: string) => void;
  onUpgradeClick: (reason?: "invoice_limit") => void;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
}

const FREE_LIMIT = 3;
const GUIDE_KEY = "bluprnt_invoice_guide_collapsed";

type ValidDocType = "invoice" | "quote" | "warranty" | "permit";

export function useInvoiceManagement({
  projectId,
  invoices,
  onUploaded,
  onUpgradeClick,
  subscription,
  hasProjectPass,
}: UseInvoiceManagementProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reviewQueueRef = useRef<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewInvoiceId, setReviewInvoiceId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<ValidDocType>("invoice");
  const [guideDismissed, setGuideDismissed] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [guideExpanded, setGuideExpanded] = useState(true);

  // Derive target type from search params
  const targetTypeFromUrl = useMemo(() => {
    const typeParam = searchParams.get("type");
    const validTypes = ["quote", "warranty", "permit"];
    return validTypes.includes(typeParam ?? "")
      ? (typeParam as ValidDocType)
      : null;
  }, [searchParams]);

  // Sync document type from URL
  useEffect(() => {
    if (targetTypeFromUrl && targetTypeFromUrl !== documentType) {
      setTimeout(() => {
        setDocumentType(targetTypeFromUrl);
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("type");
            return next;
          },
          { replace: true },
        );
      }, 0);
    }
  }, [targetTypeFromUrl, documentType, setSearchParams]);

  // Use state to handle side effects of project switching safely
  const [lastResetId, setLastResetId] = useState(projectId);

  if (lastResetId !== projectId) {
    setLastResetId(projectId);
    if (reviewInvoiceId) setReviewInvoiceId(null);
    if (uploading) setUploading(false);
    if (error) setError(null);
  }

  // Effect to handle ref-based side effects on project change
  useEffect(() => {
    reviewQueueRef.current = [];
  }, [projectId]);

  const invoiceCount = invoices.filter(
    (i) => (i.document_type ?? "invoice") === "invoice",
  ).length;

  const architectUploads = subscription?.invoice_uploads_count ?? 0;
  const isArchitectActive = isArchitectPlanEffective(subscription ?? null);

  const atLimit =
    documentType === "invoice" &&
    !hasProjectPass &&
    ((!isArchitectActive && invoiceCount >= FREE_LIMIT) ||
      (isArchitectActive && architectUploads >= 10));

  const isArchitectAtGlobalLimit = isArchitectActive && architectUploads >= 10;

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
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    if (atLimit) {
      onUpgradeClick("invoice_limit");
      return;
    }

    setUploading(true);
    setError(null);
    let successTotal = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      if (fileArray.length > 1) {
        setBatchStatus(`Uploading ${i + 1} of ${fileArray.length}...`);
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" is too large (max 10MB).`);
        continue;
      }

      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(`File "${file.name}" has an unsupported format.`);
        continue;
      }

      addUserFlowBreadcrumb("invoice_upload_started", {
        document_type: documentType,
        batch_index: i,
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
            break; // Stop batch on limit
          }
          toast.error(`Failed to upload ${file.name}: ${failure.message}`);
          continue;
        }

        successTotal++;
        onUploaded(projectId);
        const newId = data?.invoice_id;
        if (newId) {
          setReviewInvoiceId((prev) => {
            if (prev) {
              reviewQueueRef.current.push(newId);
              return prev;
            }
            return newId;
          });
        }
        addUserFlowBreadcrumb("invoice_upload_succeeded", {
          document_type: documentType,
          opens_review: Boolean(newId),
        });
      } catch (err: unknown) {
        reportClientError("invoice_upload", err);
        toast.error(`Unexpected issue uploading ${file.name}`);
        break;
      }
    }

    if (successTotal > 0) {
      dismissGuide();
      const msg =
        successTotal === 1
          ? `${documentType === "invoice" ? "Invoice" : "Document"} uploaded successfully`
          : `Successfully uploaded ${successTotal} documents.`;
      toast.success(msg);
    }

    setUploading(false);
    setBatchStatus(null);
    if (inputRef.current) inputRef.current.value = "";
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
    batchStatus,
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
