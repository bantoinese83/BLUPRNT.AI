import { useCallback, useState } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { friendlyPostgrestMutationError } from "@shared/lib/user-friendly-errors";
import { generateSellerPacketPDF } from "@/lib/pdf-export";
import { scopeRowsForSellerPacket } from "@/features/finance-tab/ledger-helpers";
import { reportClientError } from "@/lib/sentry";
import { uploadPickedDocumentToProject } from "@/lib/upload-picked-document";
import { isFreeTierInvoiceLimitReached } from "@/lib/invoice-upload-gate";
import {
  DOCUMENT_CAPTURE_HOME_COPY,
  presentDocumentCapturePrompt,
} from "@/lib/present-document-capture";
import type { ProjectRow, InvoiceRow, ScopeRow } from "@shared/types/database";
import type { AwarenessState } from "@/contexts/AwarenessContext";

interface UseDashboardHandlersProps {
  project: ProjectRow | null;
  invoices: InvoiceRow[];
  scopeItems: ScopeRow[];
  isArchitect: boolean;
  hasProjectPass: boolean;
  load: () => void;
  setUpgradeReason: AwarenessState["setUpgradeReason"];
  setShowUpgrade: (show: boolean) => void;
  setReviewInvoice: (inv: InvoiceRow | null) => void;
  setReviewOpen: (open: boolean) => void;
}

export function useDashboardHandlers({
  project,
  invoices,
  scopeItems,
  isArchitect,
  hasProjectPass,
  load,
  setUpgradeReason,
  setShowUpgrade,
  setReviewInvoice,
  setReviewOpen,
}: UseDashboardHandlersProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);

  const handleRenameSave = useCallback(
    async (newName: string) => {
      if (!project) return;
      try {
        const { error } = await supabase
          .from("projects")
          .update({ name: newName })
          .eq("id", project.id);
        if (error) throw error;
        setRenameVisible(false);
        load();
      } catch (e) {
        Alert.alert(
          "Couldn't rename project",
          friendlyPostgrestMutationError(e),
        );
      }
    },
    [project, load],
  );

  const handleExportSellerPacket = useCallback(async () => {
    if (!project) return;
    if (!isArchitect && !hasProjectPass) {
      setUpgradeReason("export");
      setShowUpgrade(true);
      return;
    }
    if (scopeItems.length === 0 && invoices.length === 0) {
      Alert.alert(
        "Nothing to export yet",
        "Add a scope item or upload an invoice, then try Export Packet again.",
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      await generateSellerPacketPDF(
        {
          id: project.id,
          property_id: project.property_id,
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
        },
        scopeRowsForSellerPacket(scopeItems),
        invoices,
        { includeAppendix: false },
      );
    } catch (err: unknown) {
      reportClientError("dashboard_seller_packet_pdf", err);
      Alert.alert(
        "Export Failed",
        "We couldn't generate the PDF. Please check your connection and try again.",
      );
    } finally {
      setIsExporting(false);
    }
  }, [
    project,
    isArchitect,
    hasProjectPass,
    scopeItems,
    invoices,
    setUpgradeReason,
    setShowUpgrade,
  ]);

  const runDashboardDocumentUpload = useCallback(
    async (files: Array<{ uri: string; mimeType?: string }>) => {
      if (!project) return;

      setIsUploading(true);
      try {
        const result = await uploadPickedDocumentToProject({
          projectId: project.id,
          files,
          successToastMessage: "Document added — your dashboard is updated.",
          onInvoiceLimitUpgrade: () => {
            setUpgradeReason("invoice_limit");
            setShowUpgrade(true);
          },
          refreshProjectData: load,
        });
        if (result.ok && result.lastInvoiceId && files.length === 1) {
          const { data: row } = await supabase
            .from("invoices")
            .select("*")
            .eq("id", result.lastInvoiceId)
            .maybeSingle();
          if (row) {
            setReviewInvoice(row as unknown as InvoiceRow);
            setReviewOpen(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } finally {
        setIsUploading(false);
      }
    },
    [
      project,
      load,
      setUpgradeReason,
      setShowUpgrade,
      setReviewInvoice,
      setReviewOpen,
    ],
  );

  const openDashboardDocumentCapture = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (isFreeTierInvoiceLimitReached(invoices, isArchitect, hasProjectPass)) {
      setUpgradeReason("invoice_limit");
      setShowUpgrade(true);
      return;
    }

    presentDocumentCapturePrompt(DOCUMENT_CAPTURE_HOME_COPY, (files) => {
      void runDashboardDocumentUpload(files);
    });
  }, [
    invoices,
    isArchitect,
    hasProjectPass,
    runDashboardDocumentUpload,
    setUpgradeReason,
    setShowUpgrade,
  ]);

  return {
    isUploading,
    isExporting,
    renameVisible,
    setRenameVisible,
    handleRenameSave,
    handleExportSellerPacket,
    openDashboardDocumentCapture,
  };
}
