import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { shouldPromptUpgradeAfterUploadFailure } from "@shared/constants/upload-error-codes";
import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { uploadDocumentWithType } from "@/lib/upload-document";
import { showAppToast } from "@/lib/app-toast";

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
): Promise<void> {
  const mime = options.mimeType || "image/jpeg";
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  try {
    const result = await uploadDocumentWithType(
      options.fileUri,
      mime,
      options.projectId,
    );

    if (!result.success) {
      if (result.error) {
        if (
          shouldPromptUpgradeAfterUploadFailure(result.errorCode, result.error)
        ) {
          options.onInvoiceLimitUpgrade();
        } else {
          Alert.alert("Upload Failed", result.error);
        }
      }
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showAppToast(options.successToastMessage);
    options.refreshProjectData();
  } catch (err) {
    Alert.alert("Upload issue", friendlyDocumentUploadError(err));
  }
}
