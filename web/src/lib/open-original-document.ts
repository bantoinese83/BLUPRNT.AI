import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";
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

export async function openOriginalDocumentForInvoice(
  invoiceId: string,
): Promise<boolean> {
  const result = await fetchInvoiceOriginalSignedUrl(invoiceId);
  if (!result.ok) {
    toast.error(result.message);
    return false;
  }

  const win = window.open(result.signedUrl, "_blank", "noopener,noreferrer");
  if (!win) {
    toast.error(invoiceOriginalMessages.popupBlocked);
    return false;
  }
  return true;
}
