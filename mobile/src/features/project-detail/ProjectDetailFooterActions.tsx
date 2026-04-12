import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { MotiView } from "moti";
import { Share2, Download } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { projectDetailStyles as styles } from "./project-detail.styles";
import type { InvoiceRow } from "@shared/types/database";

type Props = {
  detailInvoices: InvoiceRow[];
  includeAppendix: boolean;
  setIncludeAppendix: (v: boolean) => void;
  onShare: () => void;
  onExportSellerPacket: () => void;
};

export function ProjectDetailFooterActions({
  detailInvoices,
  includeAppendix,
  setIncludeAppendix,
  onShare,
  onExportSellerPacket,
}: Props) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 500 }}
      style={styles.globalActions}
    >
      <View style={styles.exportAppendixRow}>
        <View style={styles.exportAppendixTextCol}>
          <Text style={styles.exportAppendixLabel}>Append image originals</Text>
          <Text style={styles.exportAppendixHint}>
            Larger PDF. PDF uploads appear as notes only.
          </Text>
        </View>
        <Switch
          value={includeAppendix}
          onValueChange={setIncludeAppendix}
          disabled={!detailInvoices.some((i) => Boolean(i.document_id))}
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
            void onShare();
          }}
        >
          <Share2 size={18} color={Theme.colors.text.primary} />
          <Text style={styles.actionButtonText}>Share Project</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.exportBtn]}
          onPress={() => {
            void onExportSellerPacket();
          }}
        >
          <Download size={18} color={Theme.colors.text.primary} />
          <Text style={styles.actionButtonText}>Export Seller Packet</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}
