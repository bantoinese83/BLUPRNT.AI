import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { MotiView } from "moti";
import { Share2, Download } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";
import type { LedgerEntryRow } from "@shared/types/database";

type Props = {
  detailLedgerEntries: LedgerEntryRow[];
  includeAppendix: boolean;
  setIncludeAppendix: (v: boolean) => void;
  onShare: () => void;
  onExportSellerPacket: () => void;
  exporting?: boolean;
};

export function ProjectDetailFooterActions({
  detailLedgerEntries,
  includeAppendix,
  setIncludeAppendix,
  onShare,
  onExportSellerPacket,
  exporting = false,
}: Props) {
  const canIncludeUploads = detailLedgerEntries.some((i) =>
    Boolean(i.document_id),
  );

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 500 }}
      style={styles.globalActions}
    >
      <View style={styles.exportAppendixRow}>
        <View style={styles.exportAppendixTextCol}>
          <Text style={styles.exportAppendixLabel}>Include uploads in PDF</Text>
          <Text style={styles.exportAppendixHint}>
            {canIncludeUploads
              ? "Adds receipt photos at the end of your Home Archive. If a document is a PDF, we add a short note instead of the full file. Larger download — only turn on if you are comfortable sharing those images."
              : "Turn this on after you attach a photo or file to at least one document — nothing is linked yet, so the switch stays off."}
          </Text>
        </View>
        <Switch
          value={includeAppendix}
          onValueChange={setIncludeAppendix}
          disabled={!canIncludeUploads || exporting}
          accessibilityLabel="Include uploads in Home Archive PDF"
          accessibilityHint={
            canIncludeUploads
              ? "Adds an extra section with images from linked files"
              : "Requires at least one document with an attached file"
          }
          trackColor={{
            false: "rgba(148,163,184,0.35)",
            true: Theme.colors.brand.primary,
          }}
          thumbColor={Theme.colors.inputBg}
        />
      </View>
      <View style={styles.globalActionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareBtn]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void onShare();
          }}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel="Share project"
        >
          <Share2 size={18} color={Theme.colors.text.primary} />
          <Text style={styles.actionButtonText}>Share Project</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.exportBtn,
            exporting && { opacity: 0.6 },
          ]}
          onPress={() => {
            void onExportSellerPacket();
          }}
          disabled={exporting}
          accessibilityRole="button"
          accessibilityLabel={
            exporting ? "Generating PDF" : "Export Home Archive"
          }
        >
          {exporting ? (
            <ActivityIndicator
              size="small"
              color={Theme.colors.brand.primary}
            />
          ) : (
            <Download size={18} color={Theme.colors.text.primary} />
          )}
          <Text style={styles.actionButtonText}>
            {exporting ? "Generating…" : "Export Home Archive"}
          </Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}
