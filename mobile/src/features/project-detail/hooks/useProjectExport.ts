import { useCallback, useState } from "react";

import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { generateSellerPacketPDF } from "@/lib/pdf-export";
import type {
  ProjectRow,
  ScopeRow,
  LedgerEntryRow,
} from "@shared/types/database";

interface UseProjectExportProps {
  id?: string;
  project: ProjectRow | null;
  scope: ScopeRow[];
  detailLedgerEntries: LedgerEntryRow[];
  isArchitect: boolean;
  hasProjectPass: boolean;
  includeAppendix: boolean;
  setShowUpgrade: (show: boolean) => void;
}

export function useProjectExport({
  id,
  project,
  scope,
  detailLedgerEntries,
  isArchitect,
  hasProjectPass,
  includeAppendix,
  setShowUpgrade,
}: UseProjectExportProps) {
  const [exporting, setExporting] = useState(false);

  const exportSellerPacket = useCallback(async () => {
    if (!project || !id) return;
    if (exporting) return; // prevent double-tap
    if (!isArchitect && !hasProjectPass) {
      setShowUpgrade(true);
      return;
    }

    if (scope.length === 0 && detailLedgerEntries.length === 0) {
      Alert.alert(
        "Nothing to export yet",
        "Add a scope item or upload a document, then try Export Packet again.",
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      const scopeForPdf = scope.map((s) => ({
        category: s.category,
        description: s.description,
        total_cost_min: s.total_cost_min,
        total_cost_max: s.total_cost_max,
      }));
      await generateSellerPacketPDF(
        {
          id: project.id,
          property_id: project.property_id,
          name: project.name,
          estimated_min_total: project.estimated_min_total,
          estimated_max_total: project.estimated_max_total,
        },
        scopeForPdf,
        detailLedgerEntries,
        { includeAppendix },
      );
    } catch {
      Alert.alert(
        "Export Failed",
        "We couldn't generate the PDF. Check your connection and try again.",
      );
    } finally {
      setExporting(false);
    }
  }, [
    project,
    id,
    exporting,
    isArchitect,
    hasProjectPass,
    scope,
    detailLedgerEntries,
    includeAppendix,
    setShowUpgrade,
  ]);

  return { exportSellerPacket, exporting };
}
