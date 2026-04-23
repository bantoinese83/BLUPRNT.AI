import React, { createElement, useState } from "react";
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
  isCapitalLedgerDocumentType,
  ledgerDocumentTypeLabel,
} from "@shared/lib/ledger-document-labels";
import { rowIconForLedgerDocumentType } from "@/lib/ledger-type-icons";
import { DEFAULT_DOC_ICON, STATUS_COLORS } from "./constants";
import { Theme } from "@/constants/Theme";
import { invoiceReviewSheetStyles as styles } from "./invoiceReviewSheet.styles";
import { InvoiceReviewDetailRow } from "./InvoiceReviewDetailRow";
import {
  InvoiceReviewLineItemRow,
  type ScopeItemOption,
} from "./InvoiceReviewLineItemRow";
import { InvoiceReviewScopePicker } from "./InvoiceReviewScopePicker";
import { InvoiceReviewDocTypePicker } from "./InvoiceReviewDocTypePicker";

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
    ledgerDocType,
    setLedgerDocType,
    typeDirty,
  } = useInvoiceReviewDetail(invoice, projectId, isOpen);

  const [deleting, setDeleting] = useState(false);
  const [scopePickerLineId, setScopePickerLineId] = useState<string | null>(
    null,
  );
  const [docTypePickerOpen, setDocTypePickerOpen] = useState(false);
  const [originalPreviewOpen, setOriginalPreviewOpen] = useState(false);

  if (!invoice) return null;

  const docType = ledgerDocType;
  const showCapitalLineLink = isCapitalLedgerDocumentType(ledgerDocType);
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
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityLabel="Dismiss"
          />
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.content}
            >
              <View style={styles.header}>
                <View style={styles.docIconContainer}>
                  {createElement(
                    rowIconForLedgerDocumentType(ledgerDocType) ??
                      DEFAULT_DOC_ICON,
                    {
                      size: 28,
                      color: Theme.colors.brand.primary,
                    },
                  )}
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <X size={20} color={Theme.colors.text.secondary} />
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
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
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
                      icon={
                        <Calendar
                          size={16}
                          color={Theme.colors.text.secondary}
                        />
                      }
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
                    <TouchableOpacity
                      style={styles.docTypeRow}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setDocTypePickerOpen(true);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Change document type"
                    >
                      <View style={styles.docTypeRowLeft}>
                        <Receipt
                          size={16}
                          color={Theme.colors.text.secondary}
                        />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.detailLabelText}>
                            Document type
                          </Text>
                          <Text style={styles.detailValue}>
                            {ledgerDocumentTypeLabel(docType)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.docTypeChange}>Change</Text>
                    </TouchableOpacity>
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
                      accessibilityRole="button"
                      accessibilityLabel="View original upload"
                    >
                      <ExternalLink
                        size={18}
                        color={Theme.colors.brand.primary}
                      />
                      <Text style={styles.viewOriginalBtnText}>
                        View original
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  {projectId && showCapitalLineLink && lineItems.length > 0 ? (
                    <View style={styles.linesSection}>
                      <View style={styles.linesSectionHeader}>
                        <Link2 size={16} color={Theme.colors.text.muted} />
                        <Text style={styles.linesSectionTitle}>
                          Link to budget (optional)
                        </Text>
                      </View>
                      <Text style={styles.linesHint}>
                        Match lines to your estimate to track plan vs actual.
                      </Text>
                      {scopeItems.length === 0 ? (
                        <View style={styles.scopeEmptyBanner}>
                          <Text style={styles.scopeEmptyBannerText}>
                            There are no estimate lines on this project yet, so
                            nothing can be linked. Add scope from your project,
                            then open this document again.
                          </Text>
                        </View>
                      ) : null}
                      {lineItems.map((line) => (
                        <InvoiceReviewLineItemRow
                          key={line.id}
                          line={line}
                          mappedId={
                            mappings[line.id] ?? line.scope_item_id ?? ""
                          }
                          scopeItems={scopeItems}
                          linkingEnabled={scopeItems.length > 0}
                          onPick={() => {
                            void Haptics.selectionAsync();
                            setScopePickerLineId(line.id);
                          }}
                        />
                      ))}
                    </View>
                  ) : null}

                  {showCapitalLineLink &&
                    lineItems.length === 0 &&
                    !loadingDetail &&
                    !loadError && (
                      <Text style={styles.noLines}>
                        No line items yet. Totals above still update your
                        ledger.
                      </Text>
                    )}

                  <Text style={styles.reviewDismissHint}>
                    You can close anytime — the document stays in your ledger.
                  </Text>

                  {projectId &&
                    (typeDirty ||
                      (showCapitalLineLink &&
                        lineItems.length > 0 &&
                        scopeItems.length > 0)) && (
                      <TouchableOpacity
                        style={[
                          styles.saveBtn,
                          saving ? styles.saveBtnDisabled : undefined,
                        ]}
                        disabled={saving}
                        onPress={() => void handleSave()}
                      >
                        {saving ? (
                          <SnurraLoader
                            size={SnurraSize.inline}
                            tone="onPrimary"
                          />
                        ) : (
                          <Text style={styles.saveBtnText}>
                            {typeDirty &&
                            !(
                              showCapitalLineLink &&
                              lineItems.length > 0 &&
                              scopeItems.length > 0
                            )
                              ? "Save type"
                              : "Save changes"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <SnurraLoader
                        size={SnurraSize.inline}
                        tone="destructive"
                      />
                    ) : (
                      <Trash2 size={18} color={Theme.colors.status.error} />
                    )}
                    <Text style={styles.deleteBtnText}>
                      {deleting ? "Deleting..." : "Delete Document"}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </MotiView>
          </View>

          <InvoiceReviewScopePicker
            embedded
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

          <InvoiceReviewDocTypePicker
            visible={docTypePickerOpen}
            value={ledgerDocType}
            onSelect={(next) => setLedgerDocType(next)}
            onClose={() => setDocTypePickerOpen(false)}
          />

          {originalPreviewOpen ? (
            <View style={styles.originalPreviewHost}>
              <OriginalUploadPreviewModal
                key={invoice.id}
                variant="embedded"
                invoiceId={invoice.id}
                onClose={() => setOriginalPreviewOpen(false)}
              />
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}
