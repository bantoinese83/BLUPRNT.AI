import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ScrollView,
  Dimensions,
  FlatList,
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
  ExternalLink,
  LucideIcon,
  AlertTriangle,
  Link2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { supabase } from "@/lib/supabase";
import { OriginalUploadPreviewModal } from "@/components/OriginalUploadPreviewModal";
import { money } from "@shared/lib/formatters";
import type { InvoiceRow } from "@/types/database";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { Theme } from "@/constants/Theme";
import {
  useInvoiceReviewDetail,
  type LineItem,
} from "@/hooks/useInvoiceReviewDetail";

interface Props {
  invoice: InvoiceRow | null;
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onSaved?: () => void;
}

const DOC_ICONS: Record<string, LucideIcon> = {
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

const sheetMaxH = Math.round(Dimensions.get("window").height * 0.9);

export function InvoiceReviewSheet({
  invoice,
  projectId,
  isOpen,
  onClose,
  onDeleted,
  onSaved,
}: Props) {
  const {
    loading: loadingDetail,
    error: loadError,
    detail,
    lineItems,
    scopeItems,
    mappings,
    setMappings,
    saving,
    saveMappings,
  } = useInvoiceReviewDetail(invoice, projectId, isOpen);

  const [deleting, setDeleting] = useState(false);
  const [scopePickerLineId, setScopePickerLineId] = useState<string | null>(
    null,
  );
  const [originalPreviewOpen, setOriginalPreviewOpen] = useState(false);

  if (!invoice) return null;

  const docType = (invoice.document_type || "invoice").toLowerCase();
  const Icon = DOC_ICONS[docType] || Receipt;
  const statusColor =
    STATUS_COLORS[detail?.payment_status ?? invoice.payment_status ?? ""] ||
    "#64748b";

  const vendorDisplay =
    detail?.vendor_name ?? invoice.vendor_name ?? "Uncategorized Vendor";
  const totalDisplay = detail?.total ?? invoice.total ?? 0;
  const paymentLabel =
    (detail?.payment_status ?? invoice.payment_status ?? "pending")
      .charAt(0)
      .toUpperCase() +
    (detail?.payment_status ?? invoice.payment_status ?? "pending").slice(1);

  const docIdForOpen = detail?.document_id ?? invoice.document_id;

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Document",
      `Are you sure you want to remove this ${docType} from ${vendorDisplay}? This cannot be undone.`,
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
                "Something went wrong",
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

  const handleSave = async () => {
    const ok = await saveMappings();
    if (ok) {
      onSaved?.();
      onClose();
    }
  };

  const pickerOptions = [
    { id: "", label: "Not linked" },
    ...scopeItems.map((s) => ({
      id: s.id,
      label: s.category || s.description || "Budget line",
    })),
  ];

  return (
    <>
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { maxHeight: sheetMaxH }]}>
          <View style={styles.handle} />

          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
            style={styles.content}
          >
            <View style={styles.header}>
              <View style={styles.docIconContainer}>
                <Icon size={28} color="#2dd4bf" />
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {loadError ? (
              <Text style={styles.errorText}>{loadError}</Text>
            ) : null}

            {loadingDetail ? (
              <View style={styles.loadingBlock}>
                <SnurraLoader
                  size={SnurraSize.sheet}
                  accessibilityLabel="Loading document details"
                />
                <Text style={styles.loadingCaption}>Loading details…</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={styles.vendor}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {vendorDisplay}
                </Text>
                <Text style={styles.amount}>{money(totalDisplay)}</Text>

                <View style={styles.detailGrid}>
                  <DetailRow
                    icon={<Calendar size={16} color="#64748b" />}
                    label="Date"
                    value={new Date(invoice.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  />
                  <DetailRow
                    icon={<Receipt size={16} color="#64748b" />}
                    label="Document Type"
                    value={docType.charAt(0).toUpperCase() + docType.slice(1)}
                  />
                  <DetailRow
                    icon={<ShieldCheck size={16} color={statusColor} />}
                    label="Payment Status"
                    value={paymentLabel}
                    valueColor={statusColor}
                  />
                </View>

                {docIdForOpen ? (
                  <TouchableOpacity
                    style={styles.viewOriginalBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setOriginalPreviewOpen(true);
                    }}
                  >
                    <ExternalLink size={18} color="#2dd4bf" />
                    <Text style={styles.viewOriginalBtnText}>
                      View original
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {projectId && lineItems.length > 0 ? (
                  <View style={styles.linesSection}>
                    <View style={styles.linesSectionHeader}>
                      <Link2 size={16} color="#94a3b8" />
                      <Text style={styles.linesSectionTitle}>
                        Link to budget (optional)
                      </Text>
                    </View>
                    <Text style={styles.linesHint}>
                      Match lines to your estimate to track plan vs actual.
                    </Text>
                    {lineItems.map((line) => (
                      <LineItemRow
                        key={line.id}
                        line={line}
                        mappedId={mappings[line.id] ?? line.scope_item_id ?? ""}
                        scopeItems={scopeItems}
                        onPick={() => {
                          Haptics.selectionAsync();
                          setScopePickerLineId(line.id);
                        }}
                      />
                    ))}
                  </View>
                ) : null}

                {lineItems.length === 0 && !loadingDetail && !loadError && (
                  <Text style={styles.noLines}>
                    No line items yet. Totals above still update your ledger.
                  </Text>
                )}

                <Text style={styles.reviewDismissHint}>
                  You can close anytime — the document stays in your ledger.
                </Text>

                {projectId && lineItems.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.saveBtn,
                      saving ? styles.saveBtnDisabled : undefined,
                    ]}
                    disabled={saving}
                    onPress={() => void handleSave()}
                  >
                    {saving ? (
                      <SnurraLoader size={SnurraSize.inline} tone="onPrimary" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save links</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <SnurraLoader size={SnurraSize.inline} tone="destructive" />
                  ) : (
                    <Trash2 size={18} color="#f43f5e" />
                  )}
                  <Text style={styles.deleteBtnText}>
                    {deleting ? "Deleting..." : "Delete Document"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </MotiView>
        </View>
      </Modal>

      <Modal
        visible={scopePickerLineId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setScopePickerLineId(null)}
      >
        <View style={styles.pickerRoot}>
          <Pressable
            style={styles.pickerDim}
            onPress={() => setScopePickerLineId(null)}
          />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Budget line</Text>
            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item.id || "__none__"}
              style={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    if (!scopePickerLineId) return;
                    setMappings((m) => ({
                      ...m,
                      [scopePickerLineId]: item.id,
                    }));
                    Haptics.selectionAsync();
                    setScopePickerLineId(null);
                  }}
                >
                  <Text style={styles.pickerRowText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => setScopePickerLineId(null)}
            >
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {originalPreviewOpen && invoice && (
        <OriginalUploadPreviewModal
          key={invoice.id}
          invoiceId={invoice.id}
          onClose={() => setOriginalPreviewOpen(false)}
        />
      )}
    </>
  );
}

function LineItemRow({
  line,
  mappedId,
  scopeItems,
  onPick,
}: {
  line: LineItem;
  mappedId: string;
  scopeItems: { id: string; category: string }[];
  onPick: () => void;
}) {
  const isUnmapped = !mappedId;
  const label = isUnmapped
    ? "Not linked"
    : (scopeItems.find((s) => s.id === mappedId)?.category ?? "Linked");

  return (
    <View style={[styles.lineCard, isUnmapped && styles.lineCardWarn]}>
      <Text style={styles.lineDesc}>{line.description}</Text>
      <Text style={styles.lineAmt}>{money(line.line_total)}</Text>
      {isUnmapped && scopeItems.length > 0 && (
        <View style={styles.hintRow}>
          <AlertTriangle size={14} color="#fbbf24" />
          <Text style={styles.hintText}>
            Not linked to your original budget
          </Text>
        </View>
      )}
      <TouchableOpacity style={styles.linkPickerBtn} onPress={onPick}>
        <Text style={styles.linkPickerBtnText}>{label}</Text>
        <Text style={styles.linkPickerChevron}>▼</Text>
      </TouchableOpacity>
    </View>
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
    paddingBottom: 36,
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
    paddingHorizontal: 24,
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  docIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(45, 212, 191, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(45, 212, 191, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#fca5a5",
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    marginBottom: 12,
  },
  loadingBlock: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingCaption: {
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
    color: "#94a3b8",
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
    color: "#2dd4bf",
    letterSpacing: -1,
    marginBottom: 20,
  },
  detailGrid: {
    gap: 0,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
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
  viewOriginalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  viewOriginalBtnText: {
    fontSize: 15,
    fontFamily: "Outfit_600SemiBold",
    color: "#e2e8f0",
  },
  linesSection: {
    marginBottom: 16,
  },
  linesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  linesSectionTitle: {
    fontSize: 15,
    fontFamily: "Outfit_700Bold",
    color: "#e2e8f0",
  },
  linesHint: {
    fontSize: 12,
    fontFamily: "Outfit_500Medium",
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 18,
  },
  lineCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  lineCardWarn: {
    borderColor: "rgba(251, 191, 36, 0.35)",
    backgroundColor: "rgba(251, 191, 36, 0.06)",
  },
  lineDesc: {
    fontSize: 15,
    fontFamily: "Outfit_600SemiBold",
    color: "white",
    marginBottom: 4,
  },
  lineAmt: {
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
    color: "#94a3b8",
    marginBottom: 10,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  hintText: {
    fontSize: 12,
    fontFamily: "Outfit_600SemiBold",
    color: "#fbbf24",
  },
  linkPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  linkPickerBtnText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#e2e8f0",
    flex: 1,
  },
  linkPickerChevron: {
    fontSize: 10,
    color: "#94a3b8",
  },
  noLines: {
    fontSize: 13,
    fontFamily: "Outfit_500Medium",
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  reviewDismissHint: {
    fontSize: 12,
    fontFamily: "Outfit_500Medium",
    color: "#64748b",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  saveBtn: {
    backgroundColor: Theme.colors.brand.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    fontSize: 16,
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
  pickerRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  pickerSheet: {
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: sheetMaxH * 0.55,
  },
  pickerTitle: {
    fontSize: 17,
    fontFamily: "Outfit_700Bold",
    color: Theme.colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  pickerList: { maxHeight: sheetMaxH * 0.4 },
  pickerRow: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  pickerRowText: {
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    color: Theme.colors.text.primary,
  },
  pickerCancel: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  pickerCancelText: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: Theme.colors.brand.primary,
  },
});
