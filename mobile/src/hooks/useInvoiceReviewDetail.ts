import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase, invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { showAppToast } from "@/lib/app-toast";
import type { InvoiceRow } from "@/types/database";
import {
  coerceLedgerDocumentType,
  type LedgerDocumentType,
} from "@shared/lib/infer-document-type";

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  category: string | null;
  scope_item_id?: string | null;
};

export type InvoiceDetail = {
  vendor_name: string | null;
  total: number | null;
  payment_status: string;
  document_id?: string | null;
  document_type?: string | null;
  is_verified?: boolean;
};

export function useInvoiceReviewDetail(
  invoice: InvoiceRow | null,
  projectId: string | null,
  isOpen: boolean,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [scopeItems, setScopeItems] = useState<
    { id: string; category: string; description: string }[]
  >([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [ledgerDocType, setLedgerDocType] =
    useState<LedgerDocumentType>("invoice");
  const [serverLedgerDocType, setServerLedgerDocType] =
    useState<LedgerDocumentType>("invoice");

  const reset = useCallback(() => {
    setError(null);
    setDetail(null);
    setLineItems([]);
    setScopeItems([]);
    setMappings({});
    setLedgerDocType("invoice");
    setServerLedgerDocType("invoice");
  }, []);

  useEffect(() => {
    if (!isOpen || !invoice?.id || !projectId) {
      if (!isOpen) reset();
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: invData, error: invErr } = await invokeFunction<{
          invoice: InvoiceDetail & {
            id: string;
            document_type?: string | null;
          };
          line_items: LineItem[];
        }>("get-invoice", {
          body: { invoice_id: invoice.id },
        });

        if (cancelled) return;
        if (invErr || !invData) {
          setError("We couldn’t load this document’s details.");
          setLoading(false);
          return;
        }

        setDetail(invData.invoice);
        const lines = invData.line_items ?? [];
        setLineItems(lines);
        const t = coerceLedgerDocumentType(invData.invoice.document_type);
        setLedgerDocType(t);
        setServerLedgerDocType(t);

        const { data: scope, error: scopeErr } = await supabase
          .from("scope_items")
          .select("id, category, description")
          .eq("project_id", projectId);

        if (cancelled) return;
        if (scopeErr) {
          reportClientError("invoice_review_scope_list", scopeErr);
          showAppToast(
            "Budget list didn’t load — line links may be incomplete.",
            { type: "warning" },
          );
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
        lines.forEach((line) => {
          if (line.scope_item_id) initial[line.id] = line.scope_item_id;
        });
        setMappings(initial);
      } catch (err) {
        if (!cancelled) {
          setError("Something went wrong loading details.");
          reportClientError("useInvoiceReviewDetail_load", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, invoice?.id, projectId, reset]);

  const typeDirty = ledgerDocType !== serverLedgerDocType;

  const saveMappings = async () => {
    if (!projectId || !invoice?.id) return false;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const docKindChanged = ledgerDocType !== serverLedgerDocType;
      const needsVerification = detail?.is_verified === false;

      const lineUpdatePromises = Object.entries(mappings).map(
        ([lineId, scopeItemId]) =>
          supabase
            .from("invoice_line_items")
            .update({ scope_item_id: scopeItemId || null })
            .eq("id", lineId),
      );

      const typeUpdatePromises =
        (docKindChanged || needsVerification) && invoice.id
          ? [
              supabase
                .from("invoices")
                .update({
                  document_type: ledgerDocType,
                  is_verified: true, // Always verify on manual save
                })
                .eq("id", invoice.id),
              ...(docKindChanged && detail?.document_id
                ? [
                    supabase
                      .from("documents")
                      .update({ type: ledgerDocType })
                      .eq("id", detail.document_id),
                  ]
                : []),
            ]
          : [];

      const results = await Promise.all([
        ...lineUpdatePromises,
        ...typeUpdatePromises,
      ]);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      if (docKindChanged || needsVerification) {
        setServerLedgerDocType(ledgerDocType);
        if (detail) setDetail({ ...detail, is_verified: true });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const didLines = lineUpdatePromises.length > 0;
      showAppToast(
        needsVerification
          ? "Document verified."
          : docKindChanged && didLines
            ? "Changes saved."
            : docKindChanged
              ? "Document type updated."
              : "Line links saved.",
        { type: "success" },
      );
      return true;
    } catch (err) {
      reportClientError("useInvoiceReviewDetail_save", err);
      Alert.alert("Couldn’t save", "We couldn’t save your changes. Try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    error,
    detail,
    lineItems,
    scopeItems,
    mappings,
    setMappings,
    saving,
    saveMappings,
    ledgerDocType,
    setLedgerDocType,
    typeDirty,
  };
}
