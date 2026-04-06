import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase";

type SignedUrlResponse = {
  signed_url?: string;
  filename?: string;
  error?: string;
};

export async function openOriginalDocumentForInvoice(
  invoiceId: string,
): Promise<boolean> {
  const { data, error } = await invokeFunction<SignedUrlResponse>(
    "get-document-signed-url",
    { body: { invoice_id: invoiceId } },
  );

  if (error) {
    toast.error(
      "We couldn’t open the original file. Check your connection and try again.",
    );
    return false;
  }

  const body = data as SignedUrlResponse | null;
  if (body?.error) {
    toast.error(
      body.error.includes("No original")
        ? "There’s no saved file for this record."
        : "We couldn’t open the original file.",
    );
    return false;
  }

  const url = body?.signed_url;
  if (!url) {
    toast.error("We couldn’t open the original file.");
    return false;
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
