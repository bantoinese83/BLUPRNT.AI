import { useMemo } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { useDocumentReviewShared } from "@shared/hooks/use-document-review-shared";
import { reportClientError as reportError } from "@/lib/sentry";
import type { LedgerEntryRow } from "@shared/types/database";
import { useConfirmation } from "@/contexts/useConfirmation";
import { supabase, invokeFunction } from "@/lib/supabase";
import { showAppToast } from "@/lib/app-toast";

export type {
  LineItem,
  LedgerReviewDocument as LedgerEntryDetail,
} from "@shared/types/ledger-review";

export function useLedgerEntryReviewDetail(
  ledgerEntry: LedgerEntryRow | null,
  projectId: string | null,
  isOpen: boolean,
) {
  const { confirm } = useConfirmation();

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
        // We could refresh data here if needed, but the caller usually handles onSaved
      },
      onClose: () => {
        // Handled by the sheet component
      },
      confirmDelete: async () => {
        return new Promise<boolean>((resolve) => {
          confirm({
            title: "Remove document?",
            message: "This will permanently delete this record and its data.",
            confirmLabel: "Remove",
            variant: "destructive",
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
      },
    }),
    [confirm],
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
