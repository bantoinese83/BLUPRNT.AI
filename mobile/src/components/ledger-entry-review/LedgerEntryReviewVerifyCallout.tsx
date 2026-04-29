import React from "react";
import { View, Text } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { ledgerEntryReviewSheetStyles as styles } from "./ledgerEntryReviewSheet.styles";

export function LedgerEntryReviewVerifyCallout() {
  return (
    <View style={styles.verifyCallout}>
      <ShieldCheck size={20} color="#d97706" />
      <View style={styles.verifyCalloutTextWrap}>
        <Text style={styles.verifyCalloutTitle}>Review and Verify</Text>
        <Text style={styles.verifyCalloutDescription}>
          This data was extracted by AI. Confirm the vendor, amounts, and links
          below.
        </Text>
      </View>
    </View>
  );
}
