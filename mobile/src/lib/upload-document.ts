import { Alert } from "react-native";
import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { invokeFunction } from "./supabase";

export type DocumentType = "invoice" | "quote" | "warranty" | "permit";

interface UploadResult {
  invoice_id?: string;
  ocr_status?: string;
  error?: string;
}

/**
 * Prompts the user for a document type then uploads the file to the
 * upload-invoice edge function. Returns the invoice_id on success.
 */
export async function uploadDocumentWithType(
  fileUri: string,
  mimeType: string,
  projectId: string,
): Promise<{ success: boolean; invoice_id?: string; error?: string }> {
  return new Promise((resolve) => {
    Alert.alert("Document Type", "What type of document are you uploading?", [
      {
        text: "Invoice",
        onPress: () =>
          doUpload(fileUri, mimeType, "invoice", projectId, resolve),
      },
      {
        text: "Quote",
        onPress: () => doUpload(fileUri, mimeType, "quote", projectId, resolve),
      },
      {
        text: "Warranty",
        onPress: () =>
          doUpload(fileUri, mimeType, "warranty", projectId, resolve),
      },
      {
        text: "Permit",
        onPress: () =>
          doUpload(fileUri, mimeType, "permit", projectId, resolve),
      },
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve({ success: false }),
      },
    ]);
  });
}

async function doUpload(
  uri: string,
  mimeType: string,
  documentType: DocumentType,
  projectId: string,
  resolve: (result: {
    success: boolean;
    invoice_id?: string;
    error?: string;
  }) => void,
) {
  try {
    const ext = mimeType.includes("pdf")
      ? "pdf"
      : mimeType.split("/")[1] || "jpg";
    const fileName = `document_${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("document_type", documentType);
    formData.append("file", {
      uri,
      name: fileName,
      type: mimeType || "image/jpeg",
    } as unknown as Blob);

    const { data, error } = await invokeFunction<UploadResult>(
      "upload-invoice",
      {
        body: formData,
      },
    );

    if (error) {
      resolve({
        success: false,
        error: friendlyDocumentUploadError(error),
      });
      return;
    }

    if (data?.error) {
      resolve({
        success: false,
        error: friendlyDocumentUploadError(null, { error: data.error }),
      });
      return;
    }

    resolve({ success: true, invoice_id: data?.invoice_id });
  } catch (err) {
    resolve({
      success: false,
      error: friendlyDocumentUploadError(err),
    });
  }
}
