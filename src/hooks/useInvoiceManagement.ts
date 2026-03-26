import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";
import type { InvoiceRow, UserSubscriptionRow } from "@/types/database";

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

function friendlyUploadError(err: unknown, body?: { error?: string }): string {
  const msg =
    body?.error ??
    (typeof err === "object" && err && "message" in err
      ? String((err as { message?: string }).message)
      : "");
  if (
    msg.includes("Free plan") ||
    msg.includes("Free limit") ||
    msg.includes("10 invoice") ||
    msg.includes("Architect plan")
  ) {
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
    try {
      const fd = new FormData();
      fd.set("project_id", projectId);
      fd.set("file", file);
      fd.set("document_type", documentType);
      const { data, error: fnErr } = await invokeFunction<{
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
        if (
          e.includes("Free plan") ||
          e.includes("Free limit") ||
          e.includes("10 invoice") ||
          e.includes("billing period") ||
          e.includes("Upgrade")
        ) {
          onUpgradeClick("invoice_limit");
        }
        setError(
          e.includes("limit") || e.includes("Architect")
            ? e
            : friendlyUploadError(null, data),
        );
        return;
      }

      dismissGuide();
      onUploaded();
      const newId = data?.invoice_id;
      if (newId && documentType === "invoice") {
        setTimeout(() => setReviewInvoiceId(newId), 100);
      }
      toast.success(
        `${documentType === "invoice" ? "Invoice" : "Document"} uploaded successfully`,
      );
    } catch {
      setError(friendlyUploadError(null));
      toast.error("Upload failed");
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
