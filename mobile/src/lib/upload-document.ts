import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { extractUploadFailureFromInvokeResult } from "@shared/lib/upload-invoke-result";
import { invokeFunction } from "@/lib/supabase";
import { showAppToast } from "@/lib/app-toast";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing";

import type { UploadFormDocumentType } from "@shared/lib/infer-document-type";

export type DocumentType = UploadFormDocumentType;

export type UploadResult = {
  success: boolean;
  ledger_entry_id?: string;
  documentType?: DocumentType;
  error?: string;
  errorCode?: string;
  budgetHealth?: {
    isOverBudget: boolean;
    isNearingBudget: boolean;
    percentOfMax: number;
  };
};

const ACCEPTED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

/** Ensures camera / library picks send a MIME the edge function accepts (incl. HEIC on iOS). */
export function normalizeDocumentUploadMime(
  fileUri: string,
  mimeHint?: string,
): string {
  const h = (mimeHint || "").toLowerCase();
  if (ACCEPTED_MIMES.includes(h)) return h === "image/jpg" ? "image/jpeg" : h;

  const u = fileUri.toLowerCase();
  if (u.endsWith(".heic") || u.endsWith(".heif")) return "image/heic";
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".pdf")) return "application/pdf";
  return "image/jpeg";
}

/**
 * Uploads via `upload-document` with `document_type=auto` so the server classifies
 * from filename + document contents.
 */
export async function uploadDocumentWithType(
  fileUri: string,
  mimeType: string,
  projectId: string,
  options?: { fileName?: string },
): Promise<UploadResult> {
  return executeUploadWorkflow(
    fileUri,
    mimeType,
    "auto",
    projectId,
    options?.fileName,
  );
}

const UPLOAD_TIMEOUT_MS = 60000;

/** Orchestrates the UI feedback, network call, and error mapping for a document upload. */
async function executeUploadWorkflow(
  uri: string,
  mimeType: string,
  documentType: DocumentType,
  projectId: string,
  originalFileName?: string,
): Promise<UploadResult> {
  try {
    showAppToast("Starting upload... please keep the app open.");

    const formData = prepareUploadFormData(
      uri,
      mimeType,
      documentType,
      projectId,
      originalFileName,
    );
    const { data, error } = await invokeUploadWithTimeout(formData);

    const failure = extractUploadFailureFromInvokeResult(data, error);
    if (failure) {
      return {
        success: false,
        error: failure.message,
        errorCode: failure.errorCode,
      };
    }

    const resolved = data?.document_type as DocumentType | undefined;

    // Proactive Budget Alerts
    if (data?.budget_health) {
      const { isOverBudget, isNearingBudget, percentOfMax } =
        data.budget_health;
      if (isOverBudget) {
        showAppToast(
          `Budget Alert: Project at ${Math.round(percentOfMax)}% of max estimate.`,
        );
      } else if (isNearingBudget) {
        showAppToast(
          `Budget Note: ${Math.round(percentOfMax)}% of budget used.`,
        );
      }
    }

    const isOcr = resolved !== "manual";
    if (isOcr) {
      showAppToast("Upload complete. AI is processing the details...", {
        type: "success",
      });
    }

    return {
      success: true,
      ledger_entry_id: data?.ledger_entry_id,
      documentType: resolved,
      budgetHealth: data?.budget_health,
    };
  } catch (err) {
    return { success: false, error: friendlyDocumentUploadError(err) };
  }
}

/** Prepares the multipart/form-data for the Supabase Edge Function. */
function prepareUploadFormData(
  uri: string,
  mimeType: string,
  documentType: DocumentType,
  projectId: string,
  originalFileName?: string,
): FormData {
  const mime = normalizeDocumentUploadMime(uri, mimeType);
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const safeName =
    (originalFileName && originalFileName.trim()) || `doc_${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("document_type", documentType);
  formData.append("file", {
    uri,
    name: safeName,
    type: mime,
  } as unknown as Blob);

  return formData;
}

/** Calls the Edge Function with a 60-second race-timeout. */
async function invokeUploadWithTimeout(formData: FormData) {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Upload timeout")), UPLOAD_TIMEOUT_MS),
  );

  return await Promise.race([
    invokeFunction<{
      ledger_entry_id?: string;
      document_type?: string;
      error?: string;
      error_code?: string;
      budget_health?: {
        isOverBudget: boolean;
        isNearingBudget: boolean;
        percentOfMax: number;
      };
    }>(EDGE_FUNCTIONS.UPLOAD_DOCUMENT, { body: formData }),
    timeout,
  ]);
}
