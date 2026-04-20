import { Alert } from "react-native";
import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { extractUploadFailureFromInvokeResult } from "@shared/lib/upload-invoke-result";
import { invokeFunction } from "@/lib/supabase";
import { showAppToast } from "@/lib/app-toast";

export type DocumentType = "invoice" | "quote" | "warranty" | "permit";

/** Ensures camera / library picks send a MIME the edge function accepts (incl. HEIC on iOS). */
export function normalizeInvoiceUploadMime(
  fileUri: string,
  mimeHint?: string,
): string {
  const lower = (mimeHint || "").trim().toLowerCase();
  if (
    [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ].includes(lower)
  ) {
    if (lower === "image/jpg") return "image/jpeg";
    return lower;
  }
  const u = fileUri.toLowerCase();
  if (u.includes(".heic")) return "image/heic";
  if (u.includes(".heif")) return "image/heif";
  if (u.includes(".png")) return "image/png";
  if (u.includes(".webp")) return "image/webp";
  if (u.includes(".pdf")) return "application/pdf";
  return "image/jpeg";
}

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
    const mime = normalizeInvoiceUploadMime(uri, mimeType);
    const ext = mime.includes("pdf")
      ? "pdf"
      : mime.includes("png")
        ? "png"
        : mime.includes("webp")
          ? "webp"
          : mime.includes("heic") || mime.includes("heif")
            ? "heic"
            : "jpg";
    const fileName = `document_${Date.now()}.${ext}`;

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("document_type", documentType);
    formData.append("file", {
      uri,
      name: fileName,
      type: mime,
    } as unknown as Blob);

    showAppToast("Starting upload... please keep the app open.");

    // Simple timeout wrapper for the invokeFunction
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Upload timed out after 60s")), 60000),
    );

    const { data, error } = await (Promise.race([
      invokeFunction<UploadResult>("upload-invoice", {
        body: formData,
      }),
      timeoutPromise,
    ]) as Promise<{ data: UploadResult | null; error: Error | null }>);

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
