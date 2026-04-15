import { Linking, Alert } from "react-native";
import { invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import {
  invoiceOriginalMessages,
  messageForInvoiceOriginalApiError,
} from "@shared/lib/invoice-original-messages";

type SignedUrlResponse = {
  signed_url?: string;
  filename?: string;
  error?: string;
};

export type InvoiceOriginalFetchResult =
  | { ok: true; signedUrl: string; filename?: string }
  | { ok: false; message: string };

export async function fetchInvoiceOriginalSignedUrl(
  invoiceId: string,
): Promise<InvoiceOriginalFetchResult> {
  const { data, error } = await invokeFunction<SignedUrlResponse>(
    "get-document-signed-url",
    { body: { invoice_id: invoiceId } },
  );

  if (error) {
    return {
      ok: false,
      message: invoiceOriginalMessages.network,
    };
  }

  const body = data as SignedUrlResponse | null;
  if (body?.error) {
    return {
      ok: false,
      message: messageForInvoiceOriginalApiError(body.error),
    };
  }

  const url = body?.signed_url;
  if (!url) {
    return { ok: false, message: invoiceOriginalMessages.generic };
  }

  return { ok: true, signedUrl: url, filename: body.filename };
}

/** Opens the signed URL in the system browser (e.g. share flows). Prefer `OriginalUploadPreviewModal` in UI. */
export async function openOriginalDocumentForInvoice(
  invoiceId: string,
): Promise<boolean> {
  const result = await fetchInvoiceOriginalSignedUrl(invoiceId);
  if (!result.ok) {
    Alert.alert("Couldn’t open file", result.message);
    return false;
  }

  const can = await Linking.canOpenURL(result.signedUrl);
  if (!can) {
    Alert.alert(
      "Couldn’t open file",
      invoiceOriginalMessages.deviceCannotOpenLink,
    );
    return false;
  }

  try {
    await Linking.openURL(result.signedUrl);
  } catch (err: unknown) {
    reportClientError("open_invoice_document_url", err);
    Alert.alert("Couldn’t open file", invoiceOriginalMessages.openLinkFailed);
    return false;
  }
  return true;
}
