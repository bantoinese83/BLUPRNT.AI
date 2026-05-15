import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

import { OriginalUploadPreviewModal } from "@/components/OriginalUploadPreviewModal";
import type { LedgerEntryRow } from "@shared/types/database";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { useLedgerEntryReviewDetail } from "@/hooks/useLedgerEntryReviewDetail";

import {
  isCapitalLedgerDocumentType,
  ledgerDocumentTheme,
} from "@shared/lib/ledger-document-labels";
import { coerceLedgerDocumentType } from "@shared/lib/infer-document-type";
import { effectiveLedgerEntryTotalForSave } from "@shared/lib/document-review-form-config";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";
import {
  LedgerEntryReviewLineItemRow,
  type ScopeItemOption,
} from "./LedgerEntryReviewLineItemRow";
import { LedgerEntryReviewScopePicker } from "./LedgerEntryReviewScopePicker";
import { LedgerEntryReviewDocTypePicker } from "./LedgerEntryReviewDocTypePicker";
import { LedgerEntryReviewHeader } from "./LedgerEntryReviewHeader";
import { LedgerEntryReviewSummary } from "./LedgerEntryReviewSummary";
import { LedgerEntryReviewVerifyCallout } from "./LedgerEntryReviewVerifyCallout";
import { LedgerEntryReviewEditableFields } from "./LedgerEntryReviewEditableFields";
import { LedgerEntryReviewDetailGrid } from "./LedgerEntryReviewDetailGrid";
import { LedgerEntryReviewActions } from "./LedgerEntryReviewActions";

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
    reviewDates,
    setReviewDateField,
    handleDelete: hookDelete,
    deleting,
  } = useLedgerEntryReviewDetail(ledgerEntry, projectId, isOpen, onSaved);

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

  const docIdForOpen = detail?.document_id ?? ledgerEntry.document_id;
  const isUnverified = detail?.is_verified === false;

  const currentVendor = detail?.vendor_name ?? ledgerEntry.vendor_name;
  const isProcessing =
    !currentVendor ||
    currentVendor === "Vendor" ||
    currentVendor === "Document" ||
    currentVendor === "Processing...";

  const storedDocType = coerceLedgerDocumentType(
    detail?.document_type ?? ledgerEntry.document_type,
  );
  const docTypeChanged = ledgerDocType !== storedDocType;

  const vendorChanged =
    vendorName !== (detail?.vendor_name ?? ledgerEntry.vendor_name ?? "");
  const nextTotal = effectiveLedgerEntryTotalForSave(ledgerDocType, totalValue);
  const totalChanged = nextTotal !== (detail?.total ?? ledgerEntry.total ?? 0);
  const summaryChanged =
    aiSummary !== (detail?.ai_summary ?? ledgerEntry.ai_summary ?? "");

  const serverWarranty =
    detail?.warranty_expiry_date ?? ledgerEntry.warranty_expiry_date ?? "";
  const serverInsurance =
    detail?.insurance_renewal_date ?? ledgerEntry.insurance_renewal_date ?? "";
  const serverPermit =
    detail?.permit_expiration_date ?? ledgerEntry.permit_expiration_date ?? "";

  const datesDirty =
    reviewDates.warranty_expiry_date !== String(serverWarranty) ||
    reviewDates.insurance_renewal_date !== String(serverInsurance) ||
    reviewDates.permit_expiration_date !== String(serverPermit);

  const isDirty =
    docTypeChanged ||
    vendorChanged ||
    totalChanged ||
    summaryChanged ||
    datesDirty;

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
              <LedgerEntryReviewHeader
                ledgerDocType={ledgerDocType}
                isUnverified={isUnverified}
                onClose={onClose}
              />

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
                  {isUnverified && <LedgerEntryReviewVerifyCallout />}

                  <LedgerEntryReviewSummary
                    aiSummary={aiSummary}
                    isProcessing={isProcessing}
                    theme={theme}
                  />

                  <LedgerEntryReviewEditableFields
                    ledgerDocType={ledgerDocType}
                    theme={theme}
                    vendorName={vendorName}
                    setVendorName={setVendorName}
                    totalValue={totalValue}
                    setTotalValue={setTotalValue}
                    aiSummary={aiSummary}
                    setAiSummary={setAiSummary}
                    reviewDates={reviewDates}
                    onReviewDateChange={setReviewDateField}
                  />

                  <LedgerEntryReviewDetailGrid
                    ledgerEntry={ledgerEntry}
                    detail={detail}
                    docType={docType}
                    onOpenDocTypePicker={() => {
                      void Haptics.selectionAsync();
                      setDocTypePickerOpen(true);
                    }}
                  />

                  <LedgerEntryReviewActions
                    docIdForOpen={docIdForOpen}
                    onViewOriginal={() => {
                      void Haptics.selectionAsync();
                      setOriginalPreviewOpen(true);
                    }}
                    showSaveBtn={
                      !!(
                        projectId &&
                        (isUnverified ||
                          isDirty ||
                          (showCapitalLineLink &&
                            lineItems.length > 0 &&
                            scopeItems.length > 0))
                      )
                    }
                    isUnverified={isUnverified}
                    isDirty={isDirty}
                    showCapitalLineLink={showCapitalLineLink}
                    hasLineItems={lineItems.length > 0}
                    hasScopeItems={scopeItems.length > 0}
                    saving={saving}
                    onSave={() => void handleSave()}
                    onDelete={handleDelete}
                    deleting={deleting}
                    isProcessing={isProcessing}
                  />

                  {projectId && showCapitalLineLink && lineItems.length > 0 ? (
                    <View style={styles.linesSection}>
                      <Text style={styles.linesSectionTitle}>
                        Link to budget (optional)
                      </Text>
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

                  <Text style={styles.reviewDismissHint}>
                    You can close anytime — the document stays in your ledger.
                  </Text>
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
