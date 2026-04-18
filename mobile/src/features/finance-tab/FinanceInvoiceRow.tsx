import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Wrench, ShieldCheck } from "lucide-react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { Theme } from "@/constants/Theme";
import { money } from "@shared/lib/formatters";
import type { InvoiceRow } from "@shared/types/database";
import { financeTabStyles as styles } from "@/features/finance-tab/finance-tab.styles";

type FinanceInvoiceRowProps = {
  inv: InvoiceRow;
  index: number;
  onPress: () => void;
  onViewOriginal: () => void;
};

export function FinanceInvoiceRow({
  inv,
  index,
  onPress,
  onViewOriginal,
}: FinanceInvoiceRowProps) {
  return (
    <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: Math.min(index * 50, 400) }}
      >
        <GlassCard intensity={8} style={styles.invoiceCard}>
          <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
            <View style={styles.invoiceMain}>
              <View style={styles.invoiceIcon}>
                {(inv.document_type || "invoice").toLowerCase() ===
                "invoice" ? (
                  <Wrench size={18} color={Theme.colors.text.muted} />
                ) : (
                  <ShieldCheck size={18} color={Theme.colors.text.muted} />
                )}
              </View>
              <View style={styles.invoiceText}>
                <Text
                  style={styles.vendorName}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {inv.vendor_name || "Uncategorized"}
                </Text>
                <Text style={styles.invoiceDate}>
                  {new Date(inv.created_at).toLocaleDateString()} •{" "}
                  {inv.document_type || "Invoice"}
                </Text>
              </View>
              <Text style={styles.invoiceAmount}>{money(inv.total)}</Text>
            </View>
          </TouchableOpacity>
          {inv.document_id ? (
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                onViewOriginal();
              }}
              style={styles.viewOriginalBtn}
            >
              <Text style={styles.viewOriginalText}>View original</Text>
            </TouchableOpacity>
          ) : null}
        </GlassCard>
      </MotiView>
    </View>
  );
}
