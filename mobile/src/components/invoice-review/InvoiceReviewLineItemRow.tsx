import { View, Text, TouchableOpacity } from "react-native";
import { AlertTriangle } from "lucide-react-native";

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
};

export function InvoiceReviewLineItemRow({
  line,
  mappedId,
  scopeItems,
  onPick,
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
