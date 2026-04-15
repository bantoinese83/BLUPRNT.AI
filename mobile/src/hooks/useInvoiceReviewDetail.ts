import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase, invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { showAppToast } from "@/lib/app-toast";
import type { InvoiceRow } from "@/types/database";

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

  const reset = useCallback(() => {
    setError(null);
    setDetail(null);
    setLineItems([]);
    setScopeItems([]);
    setMappings({});
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
          invoice: InvoiceDetail & { id: string };
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

  const saveMappings = async () => {
    if (!projectId) return false;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // OPTIMIZATION: Use Promise.all to run updates in parallel instead of a sequential waterfall
      const updatePromises = Object.entries(mappings).map(
        ([lineId, scopeItemId]) =>
          supabase
            .from("invoice_line_items")
            .update({ scope_item_id: scopeItemId || null })
            .eq("id", lineId),
      );

      const results = await Promise.all(updatePromises);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAppToast("Line links saved.", { type: "success" });
      return true;
    } catch (err) {
      reportClientError("useInvoiceReviewDetail_save", err);
      Alert.alert(
        "Couldn’t save",
        "We couldn’t save your line links. Try again.",
      );
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
  };
}
