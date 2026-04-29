import React, { createElement, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from "react-native";
import {
  X,
  Receipt,
  ShieldCheck,
  Trash2,
  Calendar,
  ExternalLink,
  Link2,
  Sparkles,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

import { OriginalUploadPreviewModal } from "@/components/OriginalUploadPreviewModal";
import type { LedgerEntryRow } from "@shared/types/database";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { useLedgerEntryReviewDetail } from "@/hooks/useLedgerEntryReviewDetail";

import {
  isCapitalLedgerDocumentType,
  ledgerDocumentTypeLabel,
  ledgerDocumentTheme,
} from "@shared/lib/ledger-document-labels";
import { rowIconForLedgerDocumentType } from "@/lib/ledger-type-icons";
import { DEFAULT_DOC_ICON, STATUS_COLORS } from "./constants";
import { Theme } from "@/constants/Theme";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";
import { LedgerEntryReviewDetailRow } from "./LedgerEntryReviewDetailRow";
import {
  LedgerEntryReviewLineItemRow,
  type ScopeItemOption,
} from "./LedgerEntryReviewLineItemRow";
import { LedgerEntryReviewScopePicker } from "./LedgerEntryReviewScopePicker";
import { LedgerEntryReviewDocTypePicker } from "./LedgerEntryReviewDocTypePicker";

import { useConfirmation } from "@/contexts/useConfirmation";

export type LedgerEntryReviewSheetProps = {
  ledgerEntry: LedgerEntryRow | null;
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onSaved?: () => void;
};

export function LedgerEntryReviewSheet({
  ledgerEntry,
  projectId,
  isOpen,
  onClose,
  onDeleted,
  onSaved,
}: LedgerEntryReviewSheetProps) {
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
    vendorName,
    setVendorName,
    totalValue,
    setTotalValue,
    aiSummary,
    setAiSummary,
    handleDelete: hookDelete,
    deleting,
  } = useLedgerEntryReviewDetail(ledgerEntry, projectId, isOpen);

  const { confirm } = useConfirmation();
  const [scopePickerLineId, setScopePickerLineId] = useState<string | null>(
    null,
  );
  const [docTypePickerOpen, setDocTypePickerOpen] = useState(false);
  const [originalPreviewOpen, setOriginalPreviewOpen] = useState(false);

  if (!ledgerEntry) return null;

  const docType = ledgerDocType;
  const theme = ledgerDocumentTheme(docType);
  const showCapitalLineLink = isCapitalLedgerDocumentType(ledgerDocType);
  const statusColor =
    STATUS_COLORS[detail?.payment_status ?? ledgerEntry.payment_status ?? ""] ||
    "#64748b";

  const rawStatus =
    detail?.payment_status ?? ledgerEntry.payment_status ?? "pending";
  const paymentLabel =
    rawStatus === "unknown"
      ? docType === "quote"
        ? "Pending Review"
        : "Processing"
      : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  const docIdForOpen = detail?.document_id ?? ledgerEntry.document_id;
  const isUnverified = detail?.is_verified === false;

  const currentVendor = detail?.vendor_name ?? ledgerEntry.vendor_name;
  const isProcessing =
    !currentVendor ||
    currentVendor === "Vendor" ||
    currentVendor === "Document" ||
    currentVendor === "Processing...";

  const vendorChanged =
    vendorName !== (detail?.vendor_name ?? ledgerEntry.vendor_name ?? "");
  const totalChanged =
    parseFloat(totalValue) !== (detail?.total ?? ledgerEntry.total ?? 0);
  const summaryChanged =
    aiSummary !== (detail?.ai_summary ?? ledgerEntry.ai_summary ?? "");
  const isDirty = vendorChanged || totalChanged || summaryChanged;

  const handleDelete = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    confirm({
      title: "Delete Document",
      message: `Are you sure you want to remove this ${docType} from ${vendorName || "Unknown Vendor"}? This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        const ok = await hookDelete();
        if (ok) {
          onDeleted(ledgerEntry.id);
        }
      },
    });
  };

  const handleSave = async () => {
    const ok = await saveMappings();
    if (ok) {
      if (isDirty || isUnverified) {
        onSaved?.();
      }
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalRoot}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.backdrop}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={onClose}
                accessibilityLabel="Dismiss"
              />
            </View>
          </TouchableWithoutFeedback>

          <View style={styles.sheet}>
            <View style={styles.handle} />

            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 300 }}
              style={styles.content}
            >
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
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
                  {isUnverified && (
                    <View style={styles.aiBadgeHeader}>
                      <ShieldCheck size={10} color="#d97706" />
                      <Text style={styles.aiTextHeader}>AI Draft</Text>
                    </View>
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
                  {isUnverified && (
                    <View style={styles.verifyCallout}>
                      <ShieldCheck size={20} color="#d97706" />
                      <View style={styles.verifyCalloutTextWrap}>
                        <Text style={styles.verifyCalloutTitle}>
                          Review and Verify
                        </Text>
                        <Text style={styles.verifyCalloutDescription}>
                          This data was extracted by AI. Confirm the vendor,
                          amounts, and links below.
                        </Text>
                      </View>
                    </View>
                  )}

                  {(aiSummary || isProcessing) && (
                    <View
                      style={[
                        styles.summaryBox,
                        {
                          backgroundColor: theme.colors?.bg,
                          borderColor: theme.colors?.border,
                        },
                      ]}
                    >
                      <Sparkles size={20} color={theme.colors?.icon} />
                      <Text
                        style={[
                          styles.summaryText,
                          { color: theme.colors?.icon + "cc" }, // Slightly more opaque version of the icon color for text
                        ]}
                      >
                        {aiSummary ? (
                          aiSummary
                        ) : (
                          <Text
                            style={[
                              styles.summaryAnalyzing,
                              { color: theme.colors?.icon },
                            ]}
                          >
                            Analyzing Document...
                          </Text>
                        )}
                      </Text>
                    </View>
                  )}

                  <View style={styles.editableField}>
                    <Text style={styles.editableLabel}>{theme.label}</Text>
                    <TextInput
                      style={styles.editableInput}
                      value={vendorName}
                      onChangeText={setVendorName}
                      placeholder="e.g. Home Depot"
                      placeholderTextColor={Theme.colors.text.muted}
                    />
                  </View>

                  <View style={styles.editableField}>
                    <Text style={styles.editableLabel}>Total Amount ($)</Text>
                    <TextInput
                      style={styles.editableInput}
                      value={totalValue}
                      onChangeText={setTotalValue}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={Theme.colors.text.muted}
                    />
                  </View>

                  <View style={styles.editableField}>
                    <Text style={styles.editableLabel}>Document Summary</Text>
                    <TextInput
                      style={[
                        styles.editableInput,
                        styles.editableInputMultiline,
                      ]}
                      value={aiSummary}
                      onChangeText={setAiSummary}
                      multiline
                      placeholder="e.g. Purchase of premium roofing materials..."
                      placeholderTextColor={Theme.colors.text.muted}
                    />
                    <Text style={styles.editableHint}>
                      A brief description of what was purchased or documented.
                      Used by AI for project insights.
                    </Text>
                  </View>

                  <View style={styles.detailGrid}>
                    <LedgerEntryReviewDetailRow
                      icon={
                        <Calendar
                          size={16}
                          color={Theme.colors.text.secondary}
                        />
                      }
                      label="Date"
                      value={new Date(
                        ledgerEntry.created_at,
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
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
                    <LedgerEntryReviewDetailRow
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
                        <LedgerEntryReviewLineItemRow
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
                    (isUnverified ||
                      isDirty ||
                      (showCapitalLineLink &&
                        lineItems.length > 0 &&
                        scopeItems.length > 0)) && (
                      <TouchableOpacity
                        style={[
                          styles.saveBtn,
                          isUnverified ? styles.verifyBtn : undefined,
                          saving ||
                          vendorName === "Processing..." ||
                          vendorName === "Needs Review"
                            ? styles.saveBtnDisabled
                            : undefined,
                        ]}
                        disabled={
                          saving ||
                          vendorName === "Processing..." ||
                          vendorName === "Needs Review"
                        }
                        onPress={() => void handleSave()}
                      >
                        {saving ? (
                          <SnurraLoader
                            size={SnurraSize.inline}
                            tone="onPrimary"
                          />
                        ) : (
                          <>
                            {isUnverified && (
                              <ShieldCheck
                                size={18}
                                color="white"
                                style={{ marginRight: 8 }}
                              />
                            )}
                            <Text style={styles.saveBtnText}>
                              {isUnverified
                                ? "Verify & Save"
                                : isDirty &&
                                    !(
                                      showCapitalLineLink &&
                                      lineItems.length > 0 &&
                                      scopeItems.length > 0
                                    )
                                  ? "Save record"
                                  : "Save changes"}
                            </Text>
                          </>
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

          <LedgerEntryReviewScopePicker
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

          <LedgerEntryReviewDocTypePicker
            visible={docTypePickerOpen}
            value={ledgerDocType}
            onSelect={(next) => setLedgerDocType(next)}
            onClose={() => setDocTypePickerOpen(false)}
          />

          {originalPreviewOpen ? (
            <View style={styles.originalPreviewHost}>
              <OriginalUploadPreviewModal
                key={ledgerEntry.id}
                variant="embedded"
                ledgerEntryId={ledgerEntry.id}
                onClose={() => setOriginalPreviewOpen(false)}
              />
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
