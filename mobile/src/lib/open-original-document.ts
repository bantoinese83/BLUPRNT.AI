import { Alert, Linking } from "react-native";
import { invokeFunction } from "@/lib/supabase";
import {
  ledgerOriginalMessages,
  messageForLedgerOriginalApiError,
} from "@shared/lib/ledger-original-messages";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing";

type SignedUrlResponse = {
  signedUrl?: string;
  filename?: string;
  error?: string;
};

export type LedgerEntryOriginalFetchResult =
  | { ok: true; signedUrl: string; filename?: string }
  | { ok: false; message: string };

export async function fetchLedgerEntryOriginalSignedUrl(
  ledgerEntryId: string,
  options?: { width?: number; height?: number; resize?: string },
): Promise<LedgerEntryOriginalFetchResult> {
  const { data, error } = await invokeFunction<SignedUrlResponse>(
    EDGE_FUNCTIONS.GET_DOCUMENT_SIGNED_URL,
    { body: { ledger_entry_id: ledgerEntryId, ...options } },
  );

  if (error) {
    return {
      ok: false,
      message: ledgerOriginalMessages.network,
    };
  }

  const body = data as SignedUrlResponse | null;
  if (body?.error) {
    return {
      ok: false,
      message: messageForLedgerOriginalApiError(body.error),
    };
  }

  const url = body?.signedUrl;
  if (!url) {
    return { ok: false, message: ledgerOriginalMessages.generic };
  }

  return { ok: true, signedUrl: url, filename: body.filename };
}

export async function openOriginalDocumentForLedgerEntry(
  ledgerEntryId: string,
): Promise<boolean> {
  try {
    const result = await fetchLedgerEntryOriginalSignedUrl(ledgerEntryId);
    if (!result.ok) {
      Alert.alert("Couldn’t open file", result.message);
      return false;
    }

    const supported = await Linking.canOpenURL(result.signedUrl);
    if (supported) {
      await Linking.openURL(result.signedUrl);
      return true;
    } else {
      Alert.alert(
        "Couldn’t open file",
        ledgerOriginalMessages.deviceCannotOpenLink,
      );
      return false;
    }
  } catch (err) {
    console.error("[openOriginalDocumentForLedgerEntry] Error:", err);
    Alert.alert("Couldn’t open file", ledgerOriginalMessages.openLinkFailed);
    return false;
  }
}
