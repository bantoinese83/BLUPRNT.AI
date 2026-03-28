import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  X,
  Receipt,
  Wrench,
  ShieldCheck,
  Trash2,
  Calendar,
  Tag,
  CreditCard,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { supabase } from "../lib/supabase";
import { money } from "../lib/formatters";
import type { InvoiceRow } from "../types/database";

interface Props {
  invoice: InvoiceRow | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

const DOC_ICONS: Record<string, React.FC<any>> = {
  invoice: Wrench,
  quote: Tag,
  warranty: ShieldCheck,
  permit: CreditCard,
};

const STATUS_COLORS: Record<string, string> = {
  paid: "#10b981",
  pending: "#f59e0b",
  overdue: "#f43f5e",
};

export function InvoiceReviewSheet({
  invoice,
  isOpen,
  onClose,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  if (!invoice) return null;

  const docType = (invoice.document_type || "invoice").toLowerCase();
  const Icon = DOC_ICONS[docType] || Receipt;
  const statusColor = STATUS_COLORS[invoice.payment_status] || "#64748b";

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Document",
      `Are you sure you want to remove this ${docType} from ${invoice.vendor_name || "Vendor"}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const { error } = await supabase
              .from("invoices")
              .delete()
              .eq("id", invoice.id);
            setDeleting(false);
            if (error) {
              Alert.alert(
                "Error",
                "Could not delete this document. Please try again.",
              );
            } else {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              onDeleted(invoice.id);
              onClose();
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 300 }}
          style={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.docIconContainer}>
              <Icon size={28} color="#818cf8" />
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Vendor & Amount */}
          <Text style={styles.vendor}>
            {invoice.vendor_name || "Uncategorized Vendor"}
          </Text>
          <Text style={styles.amount}>{money(invoice.total)}</Text>

          {/* Detail rows */}
          <View style={styles.detailGrid}>
            <DetailRow
              icon={<Calendar size={16} color="#64748b" />}
              label="Date"
              value={new Date(invoice.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <DetailRow
              icon={<Receipt size={16} color="#64748b" />}
              label="Document Type"
              value={docType.charAt(0).toUpperCase() + docType.slice(1)}
            />
            <DetailRow
              icon={<ShieldCheck size={16} color={statusColor} />}
              label="Payment Status"
              value={
                (invoice.payment_status || "pending").charAt(0).toUpperCase() +
                (invoice.payment_status || "pending").slice(1)
              }
              valueColor={statusColor}
            />
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#f43f5e" />
            ) : (
              <Trash2 size={18} color="#f43f5e" />
            )}
            <Text style={styles.deleteBtnText}>
              {deleting ? "Deleting..." : "Delete Document"}
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabel}>
        {icon}
        <Text style={styles.detailLabelText}>{label}</Text>
      </View>
      <Text
        style={[
          styles.detailValue,
          valueColor ? { color: valueColor } : undefined,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0d1526",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  docIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(129, 140, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  vendor: {
    fontSize: 22,
    fontFamily: "Outfit_700Bold",
    color: "white",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  amount: {
    fontSize: 36,
    fontFamily: "Outfit_800ExtraBold",
    color: "#818cf8",
    letterSpacing: -1,
    marginBottom: 28,
  },
  detailGrid: {
    gap: 0,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  detailLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabelText: {
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    color: "#64748b",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.15)",
  },
  deleteBtnText: {
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
    color: "#f43f5e",
  },
});
