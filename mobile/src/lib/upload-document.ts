import { Alert } from "react-native";
import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { extractUploadFailureFromInvokeResult } from "@shared/lib/upload-invoke-result";
import { invokeFunction } from "@/lib/supabase";

export type DocumentType = "invoice" | "quote" | "warranty" | "permit";

interface UploadResult {
  invoice_id?: string;
  ocr_status?: string;
  error?: string;
  error_code?: string;
}

/**
 * Prompts the user for a document type then uploads the file to the
 * upload-invoice edge function. Returns the invoice_id on success.
 */
export async function uploadDocumentWithType(
  fileUri: string,
  mimeType: string,
  projectId: string,
): Promise<{
  success: boolean;
  invoice_id?: string;
  documentType?: DocumentType;
  error?: string;
  errorCode?: string;
}> {
  return new Promise((resolve) => {
    Alert.alert("Document Type", "What type of document are you uploading?", [
      {
        text: "Invoice",
        onPress: () =>
          postDocumentToUploadInvoice(
            fileUri,
            mimeType,
            "invoice",
            projectId,
            resolve,
          ),
      },
      {
        text: "Quote",
        onPress: () =>
          postDocumentToUploadInvoice(
            fileUri,
            mimeType,
            "quote",
            projectId,
            resolve,
          ),
      },
      {
        text: "Warranty",
        onPress: () =>
          postDocumentToUploadInvoice(
            fileUri,
            mimeType,
            "warranty",
            projectId,
            resolve,
          ),
      },
      {
        text: "Permit",
        onPress: () =>
          postDocumentToUploadInvoice(
            fileUri,
            mimeType,
            "permit",
            projectId,
            resolve,
          ),
      },
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve({ success: false }),
      },
    ]);
  });
}

/** Sends multipart form to the `upload-invoice` edge function for one document type. */
async function postDocumentToUploadInvoice(
  uri: string,
  mimeType: string,
  documentType: DocumentType,
  projectId: string,
  resolve: (result: {
    success: boolean;
    invoice_id?: string;
    documentType?: DocumentType;
    error?: string;
    errorCode?: string;
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

    const failure = extractUploadFailureFromInvokeResult(data, error);
    if (failure) {
      resolve({
        success: false,
        error: failure.message,
        errorCode: failure.errorCode,
      });
      return;
    }

    resolve({
      success: true,
      invoice_id: data?.invoice_id,
      documentType,
    });
  } catch (err) {
    resolve({
      success: false,
      error: friendlyDocumentUploadError(err),
    });
  }
}
