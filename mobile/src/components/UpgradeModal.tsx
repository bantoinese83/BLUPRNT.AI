import React from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { X } from "lucide-react-native";
import { Theme } from "../constants/Theme";
import { PRICING } from "../constants/pricing";
import * as Haptics from "expo-haptics";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: "general" | "invoice_limit" | "export";
}

/**
 * Modern Upgrade Modal using RevenueCat native Paywalls.
 * This allows for remote UI updates and best-in-class conversion flows.
 */
export function UpgradeModal({ isOpen, onClose }: Props) {
  const handlePurchaseCompleted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleRestoreCompleted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close button for non-pageSheet platforms or explicit dismiss */}
        {Platform.OS !== "ios" && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              Haptics.selectionAsync();
              onClose();
            }}
          >
            <X size={24} color={Theme.colors.text.primary} />
          </TouchableOpacity>
        )}

        <Text style={styles.priceHint} accessibilityRole="text">
          Architect ${PRICING.architectUsdPerMonth}/mo · Project Pass $
          {PRICING.projectPassUsdOneTime} one-time. Apple/Google show the final
          price in checkout.
        </Text>
        <RevenueCatUI.Paywall
          onPurchaseCompleted={handlePurchaseCompleted}
          onRestoreCompleted={handleRestoreCompleted}
          onDismiss={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  priceHint: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 16,
    paddingBottom: 8,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    color: Theme.colors.text.secondary,
    fontFamily: Theme.typography.family.medium,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  closeButton: {
    padding: 16,
    alignSelf: "flex-end",
    zIndex: 10,
  },
});
