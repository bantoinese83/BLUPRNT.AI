import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  coerceLedgerDocumentType,
  type LedgerDocumentType,
} from "../lib/infer-document-type.ts";
import {
  type LineItem,
  type LedgerReviewDocument,
  type LedgerReviewSnapshot,
} from "../types/ledger-review.ts";

export type UseDocumentReviewAdapter = {
  getSupabase: () => SupabaseClient;
  invokeFunction: <T>(
    slug: string,
    options: { body: Record<string, unknown> },
  ) => Promise<{ data: T | null; error: unknown }>;
  reportError: (msg: string) => void;
  reportClientError: (key: string, err: unknown) => void;
  showToast: (msg: string, type?: "success" | "warning" | "error") => void;
  onSaved?: (projectId: string) => void;
  onClose?: () => void;
  confirmDelete?: () => Promise<boolean>;
};

export function useDocumentReviewShared(
  documentId: string,
  projectId: string,
  isOpen: boolean,
  adapter: UseDocumentReviewAdapter,
) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<LedgerReviewDocument | null>(null);
  const [scopeItems, setScopeItems] = useState<
    { id: string; category: string; description: string }[]
  >([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [ledgerDocType, setLedgerDocType] =
    useState<LedgerDocumentType>("invoice");
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState<string>("");
  const [vendorName, setVendorName] = useState<string>("");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [totalValue, setTotalValue] = useState<string>("");

  const load = useCallback(
    async (isPoll = false) => {
      if (!isOpen || !documentId || documentId === "") {
        return;
      }

      if (!isPoll) {
        setLoading(true);
        setError(null);
      }
      try {
        const { data: invData, error: invErr } =
          await adapter.invokeFunction<LedgerReviewSnapshot>(
            "get-ledger-entry",
            {
              body: { ledger_entry_id: documentId },
            },
          );

        if (invErr) {
          console.error(
            "[useDocumentReviewShared] Edge function error:",
            invErr,
          );
        }

        if (invErr || !invData) {
          if (!isPoll) {
            const msg = "Couldn't load document.";
            setError(msg);
            adapter.reportError(msg);
          }
          return;
        }

        const merged: LedgerReviewDocument = {
          ...invData.ledger_entry,
          line_items: invData.line_items ?? [],
          budget_mapping_suggestions: invData.budget_mapping_suggestions,
        };

        // Update state if data changed, but only if user hasn't edited the fields yet
        setDocument((prevDoc) => {
          setLedgerDocType((prevType) => {
            const currentInferred = coerceLedgerDocumentType(
              prevDoc?.document_type,
            );
            if (prevType !== currentInferred) return prevType;
            return coerceLedgerDocumentType(merged.document_type);
          });

          setWarrantyExpiryDate((prevDate) => {
            if (prevDate !== (prevDoc?.warranty_expiry_date || ""))
              return prevDate;
            return merged.warranty_expiry_date || "";
          });

          setVendorName((prevVendor) => {
            if (prevVendor !== (prevDoc?.vendor_name || "")) return prevVendor;
            return merged.vendor_name || "";
          });

          setAiSummary((prevSummary) => {
            if (prevSummary !== (prevDoc?.ai_summary || "")) return prevSummary;
            return merged.ai_summary || "";
          });

          setTotalValue((prevTotal) => {
            const sourceTotal = String(merged.total ?? 0);
            if (prevTotal !== String(prevDoc?.total ?? 0)) return prevTotal;
            return sourceTotal;
          });

          return merged;
        });

        // Only fetch scope items on initial load
        if (!isPoll) {
          const supabase = adapter.getSupabase();
          const { data: scope, error: scopeErr } = await supabase
            .from("scope_items")
            .select("id, category, description")
            .eq("project_id", projectId);

          if (scopeErr) {
            adapter.reportClientError("document_review_scope_list", scopeErr);
            adapter.showToast(
              "Budget breakdown didn't load — line links may be missing.",
              "warning",
            );
            setScopeItems([]);
          } else {
            setScopeItems(
              (scope ?? []) as {
                id: string;
                category: string;
                description: string;
              }[],
            );
          }

          const initial: Record<string, string> = {};
          (invData.line_items ?? []).forEach((line: LineItem) => {
            if (line.scope_item_id) initial[line.id] = line.scope_item_id;
          });
          setMappings(initial);
        }
      } catch (err) {
        if (!isPoll) {
          const msg = "Something went wrong loading document.";
          setError(msg);
          adapter.reportClientError("document_review_load_catch", err);
        }
      } finally {
        if (!isPoll) setLoading(false);
      }
    },
    [documentId, projectId, adapter, isOpen],
  );

  useEffect(() => {
    if (!isOpen || !documentId || documentId === "") return;

    let cancelled = false;
    void load();

    const pollInterval = setInterval(() => {
      if (cancelled) return;
      setDocument((prev) => {
        if (
          prev?.is_verified === false &&
          (prev.payment_status === "unknown" ||
            prev.vendor_name === "Processing...")
        ) {
          void load(true);
        }
        return prev;
      });
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [load, isOpen, documentId]);

  const handleSave = useCallback(async () => {
    if (!document || saving) return false;
    setSaving(true);
    try {
      const supabase = adapter.getSupabase();
      const lineUpdates = Object.entries(mappings).map(
        ([lineId, scopeItemId]) =>
          supabase
            .from("ledger_line_items")
            .update({ scope_item_id: scopeItemId || null })
            .eq("id", lineId),
      );

      const results = await Promise.all(lineUpdates);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      const prevType = coerceLedgerDocumentType(document.document_type);
      const typeChanged = ledgerDocType !== prevType;
      const dateChanged =
        warrantyExpiryDate !== (document.warranty_expiry_date || "");
      const vendorChanged = vendorName !== (document.vendor_name || "");
      const summaryChanged = aiSummary !== (document.ai_summary || "");
      const totalChanged = parseFloat(totalValue) !== (document.total ?? 0);
      const needsVerification = document.is_verified === false;

      if (
        typeChanged ||
        dateChanged ||
        vendorChanged ||
        summaryChanged ||
        totalChanged ||
        needsVerification
      ) {
        const { error: invErr } = await supabase
          .from("ledger_entries")
          .update({
            document_type: ledgerDocType,
            warranty_expiry_date: warrantyExpiryDate || null,
            vendor_name: vendorName || null,
            ai_summary: aiSummary || null,
            total: parseFloat(totalValue) || 0,
            is_verified: true,
          })
          .eq("id", document.id);
        if (invErr) throw invErr;

        if (typeChanged && document.document_id) {
          const { error: docErr } = await supabase
            .from("documents")
            .update({ type: ledgerDocType })
            .eq("id", document.document_id);
          if (docErr) throw docErr;
        }
      }

      setDocument((prev) =>
        prev
          ? {
              ...prev,
              document_type: ledgerDocType,
              ai_summary: aiSummary,
              total: parseFloat(totalValue) || 0,
              is_verified: true,
            }
          : prev,
      );

      adapter.showToast(
        needsVerification ? "Document verified." : "Changes saved.",
        "success",
      );
      adapter.onSaved?.(projectId);
      adapter.onClose?.();
      return true;
    } catch (err) {
      adapter.reportClientError("document_review_save_catch", err);
      adapter.reportError("We couldn't save your changes. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    document,
    saving,
    mappings,
    ledgerDocType,
    warrantyExpiryDate,
    vendorName,
    aiSummary,
    totalValue,
    projectId,
    adapter,
  ]);

  const handleDelete = useCallback(async () => {
    if (!document) return false;

    if (adapter.confirmDelete) {
      const confirmed = await adapter.confirmDelete();
      if (!confirmed) return false;
    }

    setDeleting(true);
    try {
      const supabase = adapter.getSupabase();
      const { error } = await supabase
        .from("ledger_entries")
        .delete()
        .eq("id", document.id);

      if (error) throw error;

      adapter.showToast("Document deleted.", "success");
      adapter.onClose?.();
      return true;
    } catch (err) {
      adapter.reportClientError("document_review_delete_catch", err);
      adapter.reportError("Couldn't delete document.");
      return false;
    } finally {
      setDeleting(false);
    }
  }, [document, adapter]);

  return {
    loading,
    error,
    document,
    scopeItems,
    mappings,
    setMappings,
    saving,
    deleting,
    ledgerDocType,
    setLedgerDocType,
    warrantyExpiryDate,
    setWarrantyExpiryDate,
    vendorName,
    setVendorName,
    aiSummary,
    setAiSummary,
    totalValue,
    setTotalValue,
    handleSave,
    handleDelete,
  };
}
