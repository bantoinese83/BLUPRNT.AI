import { Linking, Alert } from "react-native";
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
    Alert.alert("Couldn’t open file", "Check your connection and try again.");
    return false;
  }

  const body = data as SignedUrlResponse | null;
  if (body?.error) {
    Alert.alert(
      "Couldn’t open file",
      body.error.includes("No original")
        ? "There’s no saved file for this record."
        : "Something went wrong.",
    );
    return false;
  }

  const url = body?.signed_url;
  if (!url) {
    Alert.alert("Couldn’t open file", "Something went wrong.");
    return false;
  }

  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert("Couldn’t open file", "This device can’t open that link.");
    return false;
  }

  await Linking.openURL(url);
  return true;
}
