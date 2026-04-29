import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { ExternalLink, ShieldCheck, Trash2 } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { SnurraLoader, SnurraSize } from "@/components/ui/SnurraLoader";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";

export type LedgerEntryReviewActionsProps = {
  docIdForOpen: string | null;
  onViewOriginal: () => void;
  showSaveBtn: boolean;
  isUnverified: boolean;
  isDirty: boolean;
  showCapitalLineLink: boolean;
  hasLineItems: boolean;
  hasScopeItems: boolean;
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
  deleting: boolean;
  isProcessing: boolean;
};

export function LedgerEntryReviewActions({
  docIdForOpen,
  onViewOriginal,
  showSaveBtn,
  isUnverified,
  isDirty,
  showCapitalLineLink,
  hasLineItems,
  hasScopeItems,
  saving,
  onSave,
  onDelete,
  deleting,
  isProcessing,
}: LedgerEntryReviewActionsProps) {
  return (
    <>
      {docIdForOpen ? (
        <TouchableOpacity
          style={styles.viewOriginalBtn}
          onPress={onViewOriginal}
          accessibilityRole="button"
          accessibilityLabel="View original upload"
        >
          <ExternalLink size={18} color={Theme.colors.brand.primary} />
          <Text style={styles.viewOriginalBtnText}>View original</Text>
        </TouchableOpacity>
      ) : null}

      {showSaveBtn && (
        <TouchableOpacity
          style={[
            styles.saveBtn,
            isUnverified ? styles.verifyBtn : undefined,
            saving || isProcessing ? styles.saveBtnDisabled : undefined,
          ]}
          disabled={saving || isProcessing}
          onPress={onSave}
        >
          {saving ? (
            <SnurraLoader size={SnurraSize.inline} tone="onPrimary" />
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
                      !(showCapitalLineLink && hasLineItems && hasScopeItems)
                    ? "Save record"
                    : "Save changes"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        disabled={deleting}
      >
        {deleting ? (
          <SnurraLoader size={SnurraSize.inline} tone="destructive" />
        ) : (
          <Trash2 size={18} color={Theme.colors.status.error} />
        )}
        <Text style={styles.deleteBtnText}>
          {deleting ? "Deleting..." : "Delete Document"}
        </Text>
      </TouchableOpacity>
    </>
  );
}
