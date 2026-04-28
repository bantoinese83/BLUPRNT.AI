import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase, invokeFunction } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { showAppToast } from "@/lib/app-toast";
import type { LedgerEntryRow } from "@shared/types/database";
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

export type LedgerEntryDetail = {
  vendor_name: string | null;
  total: number | null;
  payment_status: string;
  document_id?: string | null;
  document_type?: string | null;
  is_verified?: boolean;
};

export function useLedgerEntryReviewDetail(
  ledgerEntry: LedgerEntryRow | null,
  projectId: string | null,
  isOpen: boolean,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<LedgerEntryDetail | null>(null);
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
    if (!isOpen || !ledgerEntry?.id || !projectId) {
      if (!isOpen) reset();
      return;
    }

    let cancelled = false;

    const load = async (isPoll = false) => {
      if (!isPoll) setLoading(true);
      if (!isPoll) setError(null);
      try {
        const { data: invData, error: invErr } = await invokeFunction<{
          ledger_entry: LedgerEntryDetail & {
            id: string;
            document_type?: string | null;
          };
          line_items: LineItem[];
        }>("get-ledger-entry", {
          body: { ledger_entry_id: ledgerEntry.id },
        });

        if (cancelled) return;
        if (invErr || !invData) {
          if (!isPoll) setError("We couldn’t load this document’s details.");
          if (!isPoll) setLoading(false);
          return;
        }

        setDetail(invData.ledger_entry);
        const lines = invData.line_items ?? [];
        setLineItems(lines);
        const t = coerceLedgerDocumentType(invData.ledger_entry.document_type);
        setLedgerDocType(t);
        setServerLedgerDocType(t);

        if (!isPoll) {
          const { data: scope, error: scopeErr } = await supabase
            .from("scope_items")
            .select("id, category, description")
            .eq("project_id", projectId);

          if (cancelled) return;
          if (scopeErr) {
            reportClientError("ledger_review_scope_list", scopeErr);
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
        }
      } catch (err) {
        if (!cancelled && !isPoll) {
          setError("Something went wrong loading details.");
          reportClientError("useLedgerEntryReviewDetail_load", err);
        }
      } finally {
        if (!cancelled && !isPoll) setLoading(false);
      }
    };

    void load();

    const pollInterval = setInterval(() => {
      setDetail((prev) => {
        if (
          prev?.is_verified === false &&
          (prev.payment_status === "unknown" ||
            prev.vendor_name === "Processing..." ||
            prev.vendor_name === "Needs Review")
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
  }, [isOpen, ledgerEntry?.id, projectId, reset]);

  const typeDirty = ledgerDocType !== serverLedgerDocType;

  const saveMappings = async () => {
    if (!projectId || !ledgerEntry?.id) return false;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const docKindChanged = ledgerDocType !== serverLedgerDocType;
      const needsVerification = detail?.is_verified === false;

      const lineUpdatePromises = Object.entries(mappings).map(
        ([lineId, scopeItemId]) =>
          supabase
            .from("ledger_line_items")
            .update({ scope_item_id: scopeItemId || null })
            .eq("id", lineId),
      );

      const typeUpdatePromises =
        (docKindChanged || needsVerification) && ledgerEntry.id
          ? [
              supabase
                .from("ledger_entries")
                .update({
                  document_type: ledgerDocType,
                  is_verified: true, // Always verify on manual save
                })
                .eq("id", ledgerEntry.id),
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
      reportClientError("useLedgerEntryReviewDetail_save", err);
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
