import { Alert } from "react-native";
import { friendlyDocumentUploadError } from "@shared/lib/user-friendly-errors";
import { extractUploadFailureFromInvokeResult } from "@shared/lib/upload-invoke-result";
import { invokeFunction } from "@/lib/supabase";
import { showAppToast } from "@/lib/app-toast";

export type DocumentType = "invoice" | "quote" | "warranty" | "permit";

export type UploadResult = {
  success: boolean;
  invoice_id?: string;
  documentType?: DocumentType;
  error?: string;
  errorCode?: string;
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
export function normalizeInvoiceUploadMime(
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
 * Prompts the user for a document type then uploads the file to the
 * upload-invoice edge function. Returns the invoice_id on success.
 */
export async function uploadDocumentWithType(
  fileUri: string,
  mimeType: string,
  projectId: string,
): Promise<UploadResult> {
  const options: DocumentType[] = ["invoice", "quote", "warranty", "permit"];

  return new Promise((resolve) => {
    const buttons = options.map((type) => ({
      text: type.charAt(0).toUpperCase() + type.slice(1),
      onPress: async () => {
        const result = await executeUploadWorkflow(
          fileUri,
          mimeType,
          type,
          projectId,
        );
        resolve(result);
      },
    }));

    Alert.alert("Document Type", "What type of document are you uploading?", [
      ...buttons,
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve({ success: false }),
      },
    ]);
  });
}

/** Orchestrates the UI feedback, network call, and error mapping for a document upload. */
async function executeUploadWorkflow(
  uri: string,
  mimeType: string,
  documentType: DocumentType,
  projectId: string,
): Promise<UploadResult> {
  try {
    showAppToast("Starting upload... please keep the app open.");

    const formData = prepareUploadFormData(
      uri,
      mimeType,
      documentType,
      projectId,
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

    return { success: true, invoice_id: data?.invoice_id, documentType };
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
): FormData {
  const mime = normalizeInvoiceUploadMime(uri, mimeType);
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";

  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("document_type", documentType);
  formData.append("file", {
    uri,
    name: `doc_${Date.now()}.${ext}`,
    type: mime,
  } as unknown as Blob);

  return formData;
}

/** Calls the Edge Function with a 60-second race-timeout. */
async function invokeUploadWithTimeout(formData: FormData) {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Upload timeout")), 60000),
  );

  return await Promise.race([
    invokeFunction<{
      invoice_id?: string;
      error?: string;
      error_code?: string;
    }>("upload-invoice", { body: formData }),
    timeout,
  ]);
}
