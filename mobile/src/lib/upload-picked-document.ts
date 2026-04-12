import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { shouldPromptUpgradeAfterUploadFailure } from "@shared/constants/upload-error-codes";
import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { addUserFlowBreadcrumb } from "@/lib/sentry";
import {
  uploadDocumentWithType,
  type DocumentType,
} from "@/lib/upload-document";
import { showAppToast } from "@/lib/app-toast";

export type UploadPickedDocumentResult = {
  ok: boolean;
  invoiceId?: string;
  documentType?: DocumentType;
};

export type UploadPickedDocumentOptions = {
  projectId: string;
  fileUri: string;
  mimeType?: string;
  /** Shown after a successful upload (dashboard vs finance wording). */
  successToastMessage: string;
  onInvoiceLimitUpgrade: () => void;
  /** Typically invalidates dashboard / refetches snapshot. */
  refreshProjectData: () => void;
};

/**
 * Runs the upload-invoice flow for a file already chosen by the user.
 * Handles limit errors, generic failures, and success haptics + toast.
 */
export async function uploadPickedDocumentToProject(
  options: UploadPickedDocumentOptions,
): Promise<UploadPickedDocumentResult> {
  const mime = options.mimeType || "image/jpeg";
  const kind = mime.includes("pdf") ? "pdf" : "image";
  addUserFlowBreadcrumb("document_upload_started", { kind });
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  try {
    const result = await uploadDocumentWithType(
      options.fileUri,
      mime,
      options.projectId,
    );

    if (!result.success) {
      if (result.error) {
        const limitPrompt = shouldPromptUpgradeAfterUploadFailure(
          result.errorCode,
          result.error,
        );
        addUserFlowBreadcrumb("document_upload_failed", {
          kind,
          limit_prompt: limitPrompt,
        });
        if (limitPrompt) {
          options.onInvoiceLimitUpgrade();
        } else {
          Alert.alert("Upload Failed", result.error);
        }
      } else {
        addUserFlowBreadcrumb("document_upload_failed", {
          kind,
          limit_prompt: false,
          empty_error: true,
        });
      }
      return { ok: false };
    }

    addUserFlowBreadcrumb("document_upload_succeeded", { kind });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAppToast(options.successToastMessage);
    options.refreshProjectData();
    return {
      ok: true,
      invoiceId: result.invoice_id,
      documentType: result.documentType,
    };
  } catch (err) {
    addUserFlowBreadcrumb("document_upload_exception", { kind });
    Alert.alert("Upload issue", friendlyDocumentUploadError(err));
    return { ok: false };
  }
}
