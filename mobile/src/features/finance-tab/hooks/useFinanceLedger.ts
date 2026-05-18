import { useState, useCallback, useMemo } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { reportClientError } from "@/lib/sentry";
import { showAppToast } from "@/lib/app-toast";
import { generateSellerPacketPDF } from "@/lib/pdf-export";
import { uploadPickedDocumentToProject } from "@/lib/upload-picked-document";
import { isFreeTierLedgerEntryLimitReached } from "@/lib/ledger-entry-upload-gate";
import { useEffectiveEntitlements } from "@/hooks/useEffectiveEntitlements";
import {
  DOCUMENT_CAPTURE_LEDGER_COPY,
  presentDocumentCapturePrompt,
  type PickedFile,
} from "@/lib/present-document-capture";
import {
  computeLedgerStats,
  sortLedgerEntriesByDateDesc,
  groupLedgerEntriesByMonth,
  groupedLedgerEntriesToSections,
  scopeRowsForSellerPacket,
  type LedgerDocumentFilter,
} from "@/features/finance-tab/ledger-helpers";
import type {
  LedgerEntryRow,
  ScopeRow,
  ProjectRow,
} from "@shared/types/database";

interface UseFinanceLedgerProps {
  project: ProjectRow | null;
  ledgerEntries: LedgerEntryRow[];
  scopeItems: ScopeRow[];
  load: () => void;
  setShowUpgrade: (show: boolean) => void;
  setUpgradeReason: (reason: "export" | "ledger_limit" | "general") => void;
}

export function useFinanceLedger({
  project,
  ledgerEntries,
  scopeItems,
  load,
  setShowUpgrade,
  setUpgradeReason,
}: UseFinanceLedgerProps) {
  const { isArchitect, hasProjectPass, subscription, revenueCatPro } =
    useEffectiveEntitlements();
  const [filter, setFilter] = useState<LedgerDocumentFilter>("all");
  const [exporting, setExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = useMemo(
    () => computeLedgerStats(ledgerEntries),
    [ledgerEntries],
  );

  const sortedLedgerEntries = useMemo(
    () => sortLedgerEntriesByDateDesc(ledgerEntries),
    [ledgerEntries],
  );

  const scopeForSellerPacket = useMemo(
    () => scopeRowsForSellerPacket(scopeItems),
    [scopeItems],
  );

  const groupedLedgerEntries = useMemo(
    () => groupLedgerEntriesByMonth(sortedLedgerEntries, filter),
    [sortedLedgerEntries, filter],
  );

  const sections = useMemo(
    () => groupedLedgerEntriesToSections(groupedLedgerEntries),
    [groupedLedgerEntries],
  );

  const handleExport = useCallback(async () => {
    if (!project) return;

    if (!isArchitect && !hasProjectPass) {
      setUpgradeReason("export");
      setShowUpgrade(true);
      return;
    }

    if (scopeForSellerPacket.length === 0 && ledgerEntries.length === 0) {
      Alert.alert(
        "Nothing to export yet",
        "Add a scope item or upload a document, then try Export Home Archive again.",
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);

    try {
      await generateSellerPacketPDF(
        {
          id: project.id,
          property_id: project.property_id,
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
        },
        scopeForSellerPacket,
        ledgerEntries,
        { includeAppendix },
      );
    } catch (err: unknown) {
      reportClientError("finance_seller_packet_pdf", err);
      Alert.alert(
        "Export Failed",
        "We couldn't generate the PDF. Please check your connection.",
      );
    } finally {
      setExporting(false);
    }
  }, [
    project,
    isArchitect,
    hasProjectPass,
    scopeForSellerPacket,
    ledgerEntries,
    includeAppendix,
    setUpgradeReason,
    setShowUpgrade,
  ]);

  const runLedgerDocumentUpload = useCallback(
    async (files: PickedFile[]) => {
      if (!project) return;

      setIsUploading(true);
      try {
        const result = await uploadPickedDocumentToProject({
          projectId: project.id,
          files,
          successToastMessage: "Document added \u2014 your vault is updated.",
          onLedgerEntryLimitUpgrade: () => {
            setUpgradeReason("ledger_limit");
            setShowUpgrade(true);
          },
          refreshProjectData: load,
        });

        if (result.ok && result.lastLedgerEntryId && files.length === 1) {
          const { data: row } = await supabase
            .from("ledger_entries")
            .select("*")
            .eq("id", result.lastLedgerEntryId)
            .maybeSingle();

          return row as LedgerEntryRow;
        }
        return undefined;
      } finally {
        setIsUploading(false);
      }
    },
    [project, load, setUpgradeReason, setShowUpgrade],
  );

  const openLedgerDocumentCapture = useCallback(
    (onUploadSuccess?: (entry: LedgerEntryRow) => void) => {
      Haptics.selectionAsync();

      if (
        isFreeTierLedgerEntryLimitReached(
          ledgerEntries,
          isArchitect,
          hasProjectPass,
          { revenueCatPro, subscription },
        )
      ) {
        setUpgradeReason("ledger_limit");
        setShowUpgrade(true);
        return;
      }

      presentDocumentCapturePrompt(DOCUMENT_CAPTURE_LEDGER_COPY, (files) => {
        void (async () => {
          const entry = await runLedgerDocumentUpload(files);
          if (entry) onUploadSuccess?.(entry);
        })();
      });
    },
    [
      ledgerEntries,
      isArchitect,
      hasProjectPass,
      revenueCatPro,
      subscription,
      runLedgerDocumentUpload,
      setUpgradeReason,
      setShowUpgrade,
    ],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const { error } = await supabase
          .from("ledger_entries")
          .delete()
          .eq("id", id);
        if (error) {
          showAppToast("Couldn't remove document. Try again.");
          return false;
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showAppToast("Document removed.");
          load();
          return true;
        }
      } finally {
        setDeletingId(null);
      }
    },
    [load],
  );

  return {
    filter,
    setFilter,
    exporting,
    isUploading,
    includeAppendix,
    setIncludeAppendix,
    deletingId,
    stats,
    sections,
    handleExport,
    openLedgerDocumentCapture,
    handleDelete,
  };
}
