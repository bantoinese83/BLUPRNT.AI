import { View, Text, TouchableOpacity } from "react-native";
import { AlertTriangle } from "lucide-react-native";

import { Theme } from "@/constants/Theme";
import { money } from "@shared/lib/formatters";
import type { LineItem } from "@/hooks/useInvoiceReviewDetail";

import { invoiceReviewSheetStyles as styles } from "./invoiceReviewSheet.styles";

export type ScopeItemOption = {
  id: string;
  category: string;
  description: string;
};

type Props = {
  line: LineItem;
  mappedId: string;
  scopeItems: ScopeItemOption[];
  onPick: () => void;
  /** When false, budget rows exist but there is nothing to link to yet. */
  linkingEnabled?: boolean;
};

export function InvoiceReviewLineItemRow({
  line,
  mappedId,
  scopeItems,
  onPick,
  linkingEnabled = true,
}: Props) {
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
          <AlertTriangle size={14} color={Theme.colors.status.warning} />
          <Text style={styles.hintText}>
            Not linked to your original budget
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.linkPickerBtn,
          !linkingEnabled ? styles.linkPickerBtnDisabled : undefined,
        ]}
        onPress={onPick}
        disabled={!linkingEnabled}
        accessibilityState={{ disabled: !linkingEnabled }}
      >
        <Text style={styles.linkPickerBtnText}>{label}</Text>
        <Text style={styles.linkPickerChevron}>▼</Text>
      </TouchableOpacity>
    </View>
  );
}
