import { Alert } from "react-native";
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
      const msg = friendlyUploadError(error);
      resolve({ success: false, error: msg });
      return;
    }

    if (data?.error) {
      resolve({ success: false, error: data.error });
      return;
    }

    resolve({ success: true, invoice_id: data?.invoice_id });
  } catch (_err) {
    resolve({
      success: false,
      error: "Upload failed. Check your connection and try again.",
    });
  }
}

function friendlyUploadError(err: unknown): string {
  const msg =
    typeof err === "object" && err && "message" in err
      ? String((err as { message?: string }).message)
      : "";
  if (
    msg.includes("Free plan") ||
    msg.includes("limit") ||
    msg.includes("Architect")
  ) {
    return msg;
  }
  if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
    return "Your session expired. Please sign in again.";
  }
  if (msg.includes("403") || msg.toLowerCase().includes("access denied")) {
    return "Access denied. Please refresh and try again.";
  }
  return "Upload failed. Check your connection and try a smaller file.";
}
