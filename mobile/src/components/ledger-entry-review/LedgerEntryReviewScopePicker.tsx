import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  FlatList,
} from "react-native";
import * as Haptics from "expo-haptics";

import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";

export type PickerOption = { id: string; label: string };

type Props = {
  visible: boolean;
  options: PickerOption[];
  activeLineId: string | null;
  onClose: () => void;
  onSelect: (lineId: string, scopeId: string) => void;
  /**
   * When true, renders as an in-tree overlay (no nested Modal). Use inside
   * `LedgerEntryReviewSheet` so the picker appears above the sheet on all platforms.
   */
  embedded?: boolean;
};

export function LedgerEntryReviewScopePicker({
  visible,
  options,
  activeLineId,
  onClose,
  onSelect,
  embedded = false,
}: Props) {
  if (!visible) return null;

  const body = (
    <>
      <Pressable style={styles.pickerDim} onPress={onClose} />
      <View style={styles.pickerSheet}>
        <Text style={styles.pickerTitle}>Budget line</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item.id || "__none__"}
          style={styles.pickerList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => {
                if (!activeLineId) return;
                onSelect(activeLineId, item.id);
                void Haptics.selectionAsync();
                onClose();
              }}
            >
              <Text style={styles.pickerRowText}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
          <Text style={styles.pickerCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (embedded) {
    return (
      <View
        style={styles.pickerOverlayRoot}
        pointerEvents="box-none"
        accessibilityViewIsModal
      >
        {body}
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.pickerRoot}>{body}</View>
    </Modal>
  );
}
