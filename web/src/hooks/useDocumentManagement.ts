import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";
import type { InvoiceRow, UserSubscriptionRow } from "@shared/types/database";
import { extractUploadFailureFromInvokeResult } from "@shared/lib/upload-invoke-result";
import { shouldPromptUpgradeAfterUploadFailure } from "@shared/constants/upload-error-codes";
import { isArchitectPlanEffective } from "@shared/lib/architect-entitlement";
import { addUserFlowBreadcrumb, reportClientError } from "@/lib/sentry";
import {
  isArchitectQuotaInvoiceType,
  LEDGER_DOCUMENT_TYPES,
  type LedgerDocumentType,
  type UploadFormDocumentType,
} from "@shared/lib/infer-document-type";
import { FREE_TIER_BILL_RECEIPT_LIMIT } from "@shared/lib/invoice-quota";
import { ledgerDocumentTypeLabel } from "@shared/lib/ledger-document-labels";

interface UseDocumentManagementProps {
  projectId: string;
  documents: InvoiceRow[];
  onUploaded: (id?: string) => void;
  onUpgradeClick: (reason?: "invoice_limit") => void;
  subscription: UserSubscriptionRow | null;
  hasProjectPass: boolean;
}

const FREE_LIMIT = FREE_TIER_BILL_RECEIPT_LIMIT;
const GUIDE_KEY = "bluprnt_document_guide_collapsed";

type ValidDocType = UploadFormDocumentType;

export function useDocumentManagement({
  projectId,
  documents,
  onUploaded,
  onUpgradeClick,
  subscription,
  hasProjectPass,
}: UseDocumentManagementProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reviewQueueRef = useRef<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewDocumentId, setReviewDocumentId] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<ValidDocType>("auto");
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
    if (!typeParam) return null;
    return (LEDGER_DOCUMENT_TYPES as readonly string[]).includes(
      typeParam.toLowerCase(),
    )
      ? (typeParam.toLowerCase() as LedgerDocumentType)
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
    if (reviewDocumentId) setReviewDocumentId(null);
    if (uploading) setUploading(false);
    if (error) setError(null);
  }

  // Effect to handle ref-based side effects on project change
  useEffect(() => {
    reviewQueueRef.current = [];
  }, [projectId]);

  const documentCount = documents.filter((i) =>
    isArchitectQuotaInvoiceType(i.document_type ?? "invoice"),
  ).length;

  const architectUploads = subscription?.invoice_uploads_count ?? 0;
  const isArchitectActive = isArchitectPlanEffective(subscription ?? null);

  const isAtDocumentUploadLimit =
    !hasProjectPass &&
    ((!isArchitectActive && documentCount >= FREE_LIMIT) ||
      (isArchitectActive && architectUploads >= 10));

  /** Blocks when the user picked invoice/receipt and is at the cap. */
  const blockDocumentOnlyUpload =
    (documentType === "invoice" || documentType === "receipt") &&
    isAtDocumentUploadLimit;

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
    setReviewDocumentId(null);
    const next = reviewQueueRef.current.shift();
    if (next) {
      setTimeout(() => setReviewDocumentId(next), 80);
    }
  }, []);

  const handleUploadFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    if (blockDocumentOnlyUpload) {
      onUpgradeClick("invoice_limit");
      return;
    }

    setUploading(true);
    setError(null);
    let successTotal = 0;
    let lastServerDocType: LedgerDocumentType | null = null;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]!;

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

      addUserFlowBreadcrumb("document_upload_started", {
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
          document_type?: string;
          error?: string;
          error_code?: string;
          budget_health?: {
            isOverBudget: boolean;
            isNearingBudget: boolean;
            percentOfMax: number;
          };
        }>("upload-document", { body: fd });

        const failure = extractUploadFailureFromInvokeResult(data, fnErr);
        if (failure) {
          addUserFlowBreadcrumb("document_upload_failed", {
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

        // Proactive Budget Alerts
        if (data?.budget_health) {
          const { isOverBudget, isNearingBudget, percentOfMax } =
            data.budget_health;
          if (isOverBudget) {
            toast.error(
              `Budget Alert: This project is at ${Math.round(percentOfMax)}% of your estimated max.`,
              {
                duration: 5000,
              },
            );
          } else if (isNearingBudget) {
            toast.warning(
              `Budget Note: You have used ${Math.round(percentOfMax)}% of your estimated budget.`,
              {
                duration: 4000,
              },
            );
          }
        }

        const newId = data?.invoice_id;
        const resolvedType = (data?.document_type ??
          documentType) as ValidDocType;
        if (
          data?.document_type &&
          (LEDGER_DOCUMENT_TYPES as readonly string[]).includes(
            data.document_type,
          )
        ) {
          lastServerDocType = data.document_type as LedgerDocumentType;
        }
        if (newId) {
          setReviewDocumentId((prev) => {
            if (prev) {
              reviewQueueRef.current.push(newId);
              return prev;
            }
            return newId;
          });
        }
        addUserFlowBreadcrumb("document_upload_succeeded", {
          document_type: resolvedType,
          opens_review: Boolean(newId),
        });
      } catch (err: unknown) {
        reportClientError("document_upload", err);
        toast.error(`Unexpected issue uploading ${file.name}`);
        break;
      }
    }

    if (successTotal > 0) {
      dismissGuide();
      const labelForType = (t: string) => ledgerDocumentTypeLabel(t);
      const msg =
        successTotal === 1 && lastServerDocType
          ? `${labelForType(lastServerDocType)} uploaded (detected automatically)`
          : successTotal === 1
            ? "Document uploaded successfully"
            : `Successfully uploaded ${successTotal} documents.`;
      toast.success(msg);
    }

    setUploading(false);
    setBatchStatus(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const openFileUpload = () => {
    if (blockDocumentOnlyUpload) {
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
    reviewInvoiceId: reviewDocumentId,
    setReviewInvoiceId: setReviewDocumentId,
    closeReviewModal,
    documentType,
    setDocumentType,
    guideDismissed,
    guideExpanded,
    setGuideExpanded,
    invoiceCount: documentCount,
    atLimit: isAtDocumentUploadLimit,
    blockInvoiceOnlyUpload: blockDocumentOnlyUpload,
    isArchitectAtGlobalLimit,
    dismissGuide,
    handleUploadFile,
    openFileUpload,
    FREE_LIMIT,
  };
}
