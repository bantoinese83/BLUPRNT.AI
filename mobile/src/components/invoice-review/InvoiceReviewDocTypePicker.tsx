import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  FlatList,
} from "react-native";
import * as Haptics from "expo-haptics";

import type { LedgerDocumentType } from "@shared/lib/infer-document-type";
import { ledgerDocumentSelectOptions } from "@shared/lib/ledger-document-pickers";
import { invoiceReviewSheetStyles as styles } from "./invoiceReviewSheet.styles";

const OPTIONS = ledgerDocumentSelectOptions();

type Props = {
  visible: boolean;
  value: LedgerDocumentType;
  onSelect: (next: LedgerDocumentType) => void;
  onClose: () => void;
};

/** In-sheet overlay for choosing ledger document type (matches scope picker UX). */
export function InvoiceReviewDocTypePicker({
  visible,
  value,
  onSelect,
  onClose,
}: Props) {
  if (!visible) return null;

  return (
    <View
      style={styles.pickerOverlayRoot}
      pointerEvents="box-none"
      accessibilityViewIsModal
    >
      <Pressable style={styles.pickerDim} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <Text style={styles.pickerTitle}>Document type</Text>
        <FlatList
          data={OPTIONS}
          keyExtractor={(item) => item.value}
          style={styles.pickerList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => {
                void Haptics.selectionAsync();
                onSelect(item.value);
                onClose();
              }}
            >
              <Text style={styles.pickerRowText}>
                {item.label}
                {item.value === value ? "  ✓" : ""}
              </Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
          <Text style={styles.pickerCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
