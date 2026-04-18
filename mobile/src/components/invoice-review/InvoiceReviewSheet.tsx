import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import {
  X,
  Receipt,
  ShieldCheck,
  Trash2,
  Calendar,
  ExternalLink,
  Link2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

import { supabase } from "@/lib/supabase";
import { OriginalUploadPreviewModal } from "@/components/OriginalUploadPreviewModal";
import { money } from "@shared/lib/formatters";
import type { InvoiceRow } from "@/types/database";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { useInvoiceReviewDetail } from "@/hooks/useInvoiceReviewDetail";

import {
  DOC_ICONS,
  DEFAULT_DOC_ICON,
  STATUS_COLORS,
  sheetMaxH,
} from "./constants";
import { invoiceReviewSheetStyles as styles } from "./invoiceReviewSheet.styles";
import { InvoiceReviewDetailRow } from "./InvoiceReviewDetailRow";
import {
  InvoiceReviewLineItemRow,
  type ScopeItemOption,
} from "./InvoiceReviewLineItemRow";
import { InvoiceReviewScopePicker } from "./InvoiceReviewScopePicker";

export type InvoiceReviewSheetProps = {
  invoice: InvoiceRow | null;
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onSaved?: () => void;
};

export function InvoiceReviewSheet({
  invoice,
  projectId,
  isOpen,
  onClose,
  onDeleted,
  onSaved,
}: InvoiceReviewSheetProps) {
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
  const Icon = DOC_ICONS[docType] || DEFAULT_DOC_ICON;
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
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
              void Haptics.notificationAsync(
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
    ...scopeItems.map((s: ScopeItemOption) => ({
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
                  <InvoiceReviewDetailRow
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
                  <InvoiceReviewDetailRow
                    icon={<Receipt size={16} color="#64748b" />}
                    label="Document Type"
                    value={docType.charAt(0).toUpperCase() + docType.slice(1)}
                  />
                  <InvoiceReviewDetailRow
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
                      void Haptics.selectionAsync();
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
                      <InvoiceReviewLineItemRow
                        key={line.id}
                        line={line}
                        mappedId={mappings[line.id] ?? line.scope_item_id ?? ""}
                        scopeItems={scopeItems}
                        onPick={() => {
                          void Haptics.selectionAsync();
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

      <InvoiceReviewScopePicker
        visible={scopePickerLineId !== null}
        options={pickerOptions}
        activeLineId={scopePickerLineId}
        onClose={() => setScopePickerLineId(null)}
        onSelect={(lineId, scopeId) => {
          setMappings((m) => ({
            ...m,
            [lineId]: scopeId,
          }));
        }}
      />

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
