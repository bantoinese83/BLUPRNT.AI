import React from "react";
import { View, Text } from "react-native";

import { invoiceReviewSheetStyles as styles } from "./invoiceReviewSheet.styles";

type Props = {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
};

export function InvoiceReviewDetailRow({
  icon,
  label,
  value,
  valueColor,
}: Props) {
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
