import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Bot, ShieldCheck, FileDown, Check } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { PRICING } from "@shared/constants/pricing";
import * as Haptics from "expo-haptics";
import { usePremium } from "@/hooks/usePremium";
import { MotiView } from "moti";
import {
  ArchitectPlanIcon,
  ProjectPassIcon,
} from "@/components/icons/PlanMarks";

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
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "projectPass">(
    "monthly",
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { purchase, packages, loading } = usePremium();

  const handlePurchaseCompleted = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleRestoreCompleted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const features = [
    {
      icon: <Bot size={20} color={Theme.colors.brand.primary} />,
      title: "Renovation copilot",
      desc: "Ask why the numbers moved and what to tackle next—in plain English.",
    },
    {
      icon: <ShieldCheck size={20} color={Theme.colors.status.success} />,
      title: "Living home file",
      desc: "Photo your invoices and quotes; we read the amounts (limits vary by plan).",
    },
    {
      icon: <FileDown size={20} color={Theme.colors.status.info} />,
      title: "Listing-ready PDF",
      desc: "Download a polished packet for agents, buyers, or your own records.",
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
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          bounces
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: Math.max(insets.top, 12) + 36,
              paddingBottom: Math.max(insets.bottom, 16) + 32,
            },
          ]}
        >
          {/* Hero Header */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800 }}
            style={styles.hero}
          >
            <View style={styles.heroIconBadge}>
              {selectedPlan === "monthly" ? (
                <ArchitectPlanIcon size={40} />
              ) : (
                <ProjectPassIcon size={40} />
              )}
            </View>
            <Text style={styles.heroTitle}>Level up your remodel file</Text>
            <Text style={styles.heroSubtitle}>
              {reason === "invoice_limit"
                ? "You’ve used the free invoice slots for this project. Upgrade to keep snapping receipts without hitting a wall."
                : reason === "export"
                  ? "Upgrade to Pro to build full PDF packets and your complete home file."
                  : "Keep budgets, photos of bills, and one-tap exports in a single place—built for homeowners."}
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
                <View style={styles.planTitleRow}>
                  <ArchitectPlanIcon size={22} />
                  <Text style={styles.planName}>Pro — monthly</Text>
                </View>
                {selectedPlan === "monthly" && (
                  <Check size={18} color={Theme.colors.brand.primary} />
                )}
              </View>
              <Text style={styles.planTierHint}>
                Full app access (Architect tier)
              </Text>
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
                selectedPlan === "projectPass" && styles.planCardActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedPlan("projectPass");
              }}
            >
              <View style={styles.planHeader}>
                <View style={styles.planTitleRow}>
                  <ProjectPassIcon size={22} />
                  <Text style={styles.planName}>Project Pass</Text>
                </View>
                {selectedPlan === "projectPass" && (
                  <Check size={18} color={Theme.colors.brand.primary} />
                )}
              </View>
              <Text style={styles.planPrice}>
                ${PRICING.projectPassUsdOneTime}
                <Text style={styles.planPeriod}> once</Text>
              </Text>
              <Text style={styles.planTagline}>
                6 months of full tools for one job · then view-only while
                BLUPRNT is available.
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

            <TouchableOpacity
              style={[
                styles.continueButton,
                isPurchasing && styles.continueButtonDisabled,
              ]}
              disabled={isPurchasing || loading}
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsPurchasing(true);
                try {
                  // Find correct package from RevenueCat based on selection
                  const targetIdentifier =
                    selectedPlan === "monthly" ? "$rc_monthly" : "$rc_lifetime";
                  const pkg = packages.find(
                    (p) => p.identifier === targetIdentifier,
                  );

                  if (pkg) {
                    const success = await purchase(pkg);
                    if (success) handlePurchaseCompleted();
                  } else {
                    console.error(
                      "Could not find matching package in RevenueCat offerings for:",
                      targetIdentifier,
                    );
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsPurchasing(false);
                }
              }}
            >
              <Text style={styles.continueButtonText}>
                {isPurchasing ? "Securing Plan..." : "Continue"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestoreCompleted}
            >
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.closeFloat, { top: Math.max(insets.top, 8) + 8 }]}
          onPress={onClose}
          accessibilityLabel="Close"
        >
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
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: "center",
    marginBottom: 40,
  },
  heroIconBadge: {
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
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  planName: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  planTierHint: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    marginBottom: 6,
    lineHeight: 14,
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
  continueButton: {
    backgroundColor: Theme.colors.brand.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
  },
  restoreButton: {
    paddingVertical: 8,
  },
  restoreText: {
    color: Theme.colors.text.secondary,
    fontSize: 13,
    fontFamily: Theme.typography.family.medium,
  },
  closeFloat: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
});
