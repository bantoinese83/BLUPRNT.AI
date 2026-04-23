import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { shouldPromptUpgradeAfterUploadFailure } from "@shared/constants/upload-error-codes";
import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { addUserFlowBreadcrumb } from "@/lib/sentry";
import { uploadDocumentWithType } from "@/lib/upload-document";
import { showAppToast } from "@/lib/app-toast";

export type UploadPickedDocumentResult = {
  ok: boolean;
  uploadedCount: number;
  lastInvoiceId?: string;
};

export type PickedFile = {
  uri: string;
  mimeType?: string;
};

export type UploadPickedDocumentOptions = {
  projectId: string;
  files: PickedFile[];
  /** Shown after a successful upload (dashboard vs finance wording). */
  successToastMessage: string;
  onInvoiceLimitUpgrade: () => void;
  /** Typically invalidates dashboard / refetches snapshot. */
  refreshProjectData: () => void;
};

/**
 * Runs the upload-invoice flow for one or more files chosen by the user.
 * Handles limit errors, generic failures, and success haptics + toast.
 */
export async function uploadPickedDocumentToProject(
  options: UploadPickedDocumentOptions,
): Promise<UploadPickedDocumentResult> {
  const fileCount = options.files.length;
  if (fileCount === 0) return { ok: false, uploadedCount: 0 };

  // Initial feedback for starting the process
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  let successCount = 0;
  let lastId: string | undefined;

  for (let i = 0; i < fileCount; i++) {
    const file = options.files[i];
    const mime = file.mimeType || "image/jpeg";
    const kind = mime.includes("pdf") ? "pdf" : "image";

    if (fileCount > 1) {
      showAppToast(`Uploading ${i + 1} of ${fileCount}...`);
    }

    addUserFlowBreadcrumb("document_upload_started", { kind, batch_index: i });

    try {
      const result = await uploadDocumentWithType(
        file.uri,
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
            break; // Stop batch on limit
          } else {
            Alert.alert(
              "Upload didn’t go through",
              `Issue with file ${i + 1}: ${friendlyDocumentUploadError(undefined, { error: result.error })}`,
            );
            if (fileCount > 1) break;
          }
        }
        continue;
      }

      successCount++;
      lastId = result.invoice_id;
      addUserFlowBreadcrumb("document_upload_succeeded", { kind });

      // Minor tick feedback for each file in a small batch,
      // but skip for large batches to avoid vibrating too much.
      if (fileCount <= 3) {
        Haptics.selectionAsync();
      }
    } catch (err) {
      addUserFlowBreadcrumb("document_upload_exception", { kind });
      Alert.alert("Upload issue", friendlyDocumentUploadError(err));
      break;
    }
  }

  if (successCount > 0) {
    // FINAL batch success notification
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const msg =
      successCount === 1
        ? options.successToastMessage
        : `Successfully uploaded ${successCount} documents.`;

    showAppToast(msg, { type: "success" });
    options.refreshProjectData();

    return {
      ok: true,
      uploadedCount: successCount,
      lastInvoiceId: lastId,
    };
  }

  return { ok: false, uploadedCount: 0 };
}
