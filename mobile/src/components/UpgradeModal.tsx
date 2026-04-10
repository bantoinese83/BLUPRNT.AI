import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import {
  X,
  Sparkles,
  ShieldCheck,
  FileDown,
  Crown,
  Check,
} from "lucide-react-native";
import { Theme } from "../constants/Theme";
import { PRICING } from "../../../shared/constants/pricing";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: "general" | "invoice_limit" | "export";
}

/**
 * High-fidelity Premium Paywall.
 * Shows a custom designed UI by default, with RevenueCat Paywall overlay
 * as the functional layer for production builds.
 */
export function UpgradeModal({ isOpen, onClose, reason = "general" }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "lifetime">(
    "monthly",
  );

  const handlePurchaseCompleted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleRestoreCompleted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const features = [
    {
      icon: <Sparkles size={20} color={Theme.colors.brand.primary} />,
      title: "Advanced AI Assistant",
      desc: "Instant answers for budget anomalies and stage guidance.",
    },
    {
      icon: <ShieldCheck size={20} color={Theme.colors.status.success} />,
      title: "Verified Property Ledger",
      desc: "Unlimited receipt logging with OCR verification.",
    },
    {
      icon: <FileDown size={20} color="#4F46E5" />,
      title: "Pro Seller Packets",
      desc: "Export high-resolution PDF ledgers for resale value.",
    },
  ];

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Hero Header */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800 }}
            style={styles.hero}
          >
            <View style={styles.crownIcon}>
              <Crown size={32} color={Theme.colors.brand.primary} />
            </View>
            <Text style={styles.heroTitle}>Unlock Full Potential</Text>
            <Text style={styles.heroSubtitle}>
              {reason === "invoice_limit"
                ? "You've reached the free ledger limit. Upgrade to keep tracking your property equity."
                : reason === "export"
                  ? "Upgrade to Architect to generate high-fidelity PDF packets and resale ledgers."
                  : "Join thousands of homeowners building equity with AI-guided renovations."}
            </Text>
            {reason === "invoice_limit" ? (
              <Text style={styles.invoiceLimitHint}>
                Only invoice uploads count toward this limit—not quotes,
                warranties, or permits.
              </Text>
            ) : null}
          </MotiView>

          {/* Features */}
          <View style={styles.featuresList}>
            {features.map((f, i) => (
              <MotiView
                key={f.title}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: "timing",
                  duration: 500,
                  delay: 200 + i * 100,
                }}
                style={styles.featureItem}
              >
                <View style={styles.featureIconBg}>{f.icon}</View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </MotiView>
            ))}
          </View>

          {/* Plan Selection */}
          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === "monthly" && styles.planCardActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedPlan("monthly");
              }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Architect Monthly</Text>
                {selectedPlan === "monthly" && (
                  <Check size={18} color={Theme.colors.brand.primary} />
                )}
              </View>
              <Text style={styles.planPrice}>
                ${PRICING.architectUsdPerMonth}
                <Text style={styles.planPeriod}>/mo</Text>
              </Text>
              <Text style={styles.planTagline}>
                Best for active renovations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === "lifetime" && styles.planCardActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedPlan("lifetime");
              }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Project Pass</Text>
                {selectedPlan === "lifetime" && (
                  <Check size={18} color={Theme.colors.brand.primary} />
                )}
              </View>
              <Text style={styles.planPrice}>
                ${PRICING.projectPassUsdOneTime}
                <Text style={styles.planPeriod}> once</Text>
              </Text>
              <Text style={styles.planTagline}>
                Lifetime access for one property
              </Text>
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.priceHint}>
              Subscriptions auto-renew and can be cancelled any time. The final
              price is shown in the App Store confirmation.
            </Text>

            {/* Functional RC layer overlayed briefly or as the button target */}
            <RevenueCatUI.Paywall
              onPurchaseCompleted={handlePurchaseCompleted}
              onRestoreCompleted={handleRestoreCompleted}
              onDismiss={onClose}
              style={styles.rcPaywall}
            />
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.closeFloat} onPress={onClose}>
          <X size={20} color={Theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  hero: {
    alignItems: "center",
    marginBottom: 40,
  },
  crownIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.15)",
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  invoiceLimitHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  featuresList: {
    gap: 24,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },
  plansContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  planCardActive: {
    borderColor: Theme.colors.brand.primary,
    backgroundColor: "rgba(13, 148, 136, 0.03)",
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  planName: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  planPrice: {
    fontSize: 24,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    marginBottom: 2,
  },
  planPeriod: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    fontFamily: Theme.typography.family.regular,
  },
  planTagline: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: Theme.colors.brand.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    color: "white",
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    letterSpacing: 1,
  },
  footer: {
    alignItems: "center",
  },
  priceHint: {
    fontSize: 11,
    color: Theme.colors.text.muted,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 16,
    paddingHorizontal: 40,
  },
  rcPaywall: {
    width: "100%",
    // In dev builds/Expo, RC will show its button. In Prod, it renders the full UI.
    // We adjust height to only show the "Buy" trigger if the UI is custom.
    height: Platform.OS === "web" ? 0 : 64,
  },
  closeFloat: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
});
