import { useMemo } from "react";
import { toast } from "sonner";
import { useDocumentReviewShared } from "@shared/hooks/use-document-review-shared";
import { reportClientError as reportError } from "@/lib/sentry";
import { supabase, invokeFunction } from "@/lib/supabase";

export type {
  LineItem,
  ScopeSuggestion,
  LedgerReviewDocument as DocumentData,
} from "@shared/types/ledger-review";

export function useDocumentReviewDetail(
  documentId: string,
  projectId: string,
  onSaved?: (id?: string) => void,
  onClose?: () => void,
) {
  const adapter = useMemo(
    () => ({
      getSupabase: () => supabase,
      invokeFunction: <T>(
        slug: string,
        options: { body: Record<string, unknown> },
      ) => invokeFunction<T>(slug, options),
      reportError: (msg: string) => toast.error(msg),
      reportClientError: (key: string, err: unknown) => reportError(key, err),
      showToast: (msg: string, type?: "success" | "warning" | "error") => {
        if (type === "success") toast.success(msg);
        else if (type === "warning") toast.warning(msg);
        else toast.error(msg);
      },
      onSaved,
      onClose,
    }),
    [onSaved, onClose],
  );

  const shared = useDocumentReviewShared(documentId, projectId, true, adapter);

  return {
    ...shared,
    handleSaveMappings: shared.handleSave,
  };
}
