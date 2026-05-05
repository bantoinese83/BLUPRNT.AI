import { useMemo } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useDocumentReviewShared } from "@shared/hooks/use-document-review-shared";
import { reportClientError as reportError } from "@/lib/sentry";
import type { LedgerEntryRow } from "@shared/types/database";
import { supabase, invokeFunction } from "@/lib/supabase";
import { showAppToast } from "@/lib/app-toast";

export type {
  LineItem,
  LedgerReviewDocument as LedgerEntryDetail,
} from "@shared/types/ledger-review";

/**
 * Ledger review for mobile. Confirmation before delete is owned by
 * {@link LedgerEntryReviewSheet} (same pattern as web: modal confirms, shared hook deletes).
 */
export function useLedgerEntryReviewDetail(
  ledgerEntry: LedgerEntryRow | null,
  projectId: string | null,
  isOpen = false,
) {
  const adapter = useMemo(
    () => ({
      getSupabase: () => supabase,
      invokeFunction: <T>(
        slug: string,
        options: { body: Record<string, unknown> },
      ) => invokeFunction<T>(slug, options),
      reportError: (msg: string) => Alert.alert("Error", msg),
      reportClientError: (key: string, err: unknown) => reportError(key, err),
      showToast: (msg: string, type?: "success" | "warning" | "error") => {
        if (type === "success") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        showAppToast(msg, { type });
      },
      onSaved: () => {
        // Caller usually handles refresh
      },
      onClose: () => {
        // Handled by the sheet component
      },
    }),
    [],
  );

  const shared = useDocumentReviewShared(
    ledgerEntry?.id ?? "",
    projectId ?? "",
    isOpen,
    adapter,
  );

  return {
    ...shared,
    detail: shared.document,
    lineItems: shared.document?.line_items ?? [],
    saveMappings: shared.handleSave,
    typeDirty: false, // Could be calculated if needed by comparing shared.ledgerDocType with shared.document.document_type
  };
}
