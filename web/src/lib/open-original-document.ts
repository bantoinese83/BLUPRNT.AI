import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";

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
      message:
        "We couldn’t open the original file. Check your connection and try again.",
    };
  }

  const body = data as SignedUrlResponse | null;
  if (body?.error) {
    return {
      ok: false,
      message: body.error.includes("No original")
        ? "There’s no saved file for this record."
        : "We couldn’t open the original file.",
    };
  }

  const url = body?.signed_url;
  if (!url) {
    return { ok: false, message: "We couldn’t open the original file." };
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
    toast.error(
      "We opened the link, but your browser blocked the new tab. Allow pop-ups for this site or copy the link from your browser settings.",
    );
    return false;
  }
  return true;
}
