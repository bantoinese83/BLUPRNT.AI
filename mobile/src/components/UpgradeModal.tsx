import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Bot, ShieldCheck, FileDown, Check } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { PRICING } from "@shared/constants/pricing";
import * as Haptics from "expo-haptics";
import { usePremium } from "@/hooks/usePremium";
import {
  PURCHASE_FAILED_GENERIC,
  PURCHASE_NO_PRODUCTS,
  PURCHASE_OFFERINGS_LOAD_ERROR,
  PURCHASE_PACKAGE_MISSING,
  PURCHASE_RESTORE_FAILED,
  PURCHASE_RESTORE_NONE,
} from "@/lib/purchase-messages";
import { MotiView } from "moti";
import { PUBLIC_SUPPORT_PAGE_URL } from "@shared/constants/public-site";
import {
  ArchitectPlanIcon,
  ProjectPassIcon,
} from "@/components/icons/PlanMarks";
import { FREE_TIER_BILL_RECEIPT_LIMIT } from "@shared/lib/invoice-quota";

const ARCHITECT_INVOICE_LIMIT = 10;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: "general" | "invoice_limit" | "export";
  /** When true, monthly (Architect) is already active — align with web paywall. */
  isArchitect?: boolean;
  hasProjectPass?: boolean;
}

/**
 * High-fidelity Premium Paywall.
 * Shows a custom designed UI by default, with RevenueCat Paywall overlay
 * as the functional layer for production builds.
 */
export function UpgradeModal({
  isOpen,
  onClose,
  reason = "general",
  isArchitect = false,
  hasProjectPass = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "projectPass">(
    "monthly",
  );
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const {
    purchase,
    packages,
    loading,
    offeringsError,
    noProductsConfigured,
    retryOfferings,
    restore,
  } = usePremium();

  const canPurchase =
    !loading && !offeringsError && !noProductsConfigured && packages.length > 0;

  const selectionMatchesCurrentPlan =
    (selectedPlan === "monthly" && isArchitect) ||
    (selectedPlan === "projectPass" && hasProjectPass);

  const handlePurchaseCompleted = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const result = await restore();
      if (result === "ok") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
        return;
      }
      if (result === "not_found") {
        Alert.alert("No purchase found", PURCHASE_RESTORE_NONE, [
          { text: "OK" },
        ]);
        return;
      }
      Alert.alert("Couldn’t restore", PURCHASE_RESTORE_FAILED, [
        { text: "OK" },
      ]);
    } finally {
      setIsRestoring(false);
    }
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
              {reason === "export" && (isArchitect || hasProjectPass)
                ? "You already have full access to exports and premium tools on this account."
                : reason === "invoice_limit" && isArchitect
                  ? `You’ve used your ${ARCHITECT_INVOICE_LIMIT} bill or receipt uploads for this billing period. Your limit resets when your subscription renews.`
                  : reason === "invoice_limit" && hasProjectPass
                    ? "You’ve reached the upload limit for this project while your Project Pass is active."
                    : reason === "invoice_limit"
                      ? `You’ve used all ${FREE_TIER_BILL_RECEIPT_LIMIT} free bill or receipt uploads on this project. Upgrade to add more anytime.`
                      : reason === "export"
                        ? "Upgrade to Pro to build full PDF packets and your complete home file."
                        : "Keep budgets, photos of bills, and one-tap exports in a single place—built for homeowners."}
            </Text>
            {reason === "invoice_limit" ? (
              <Text style={styles.invoiceLimitHint}>
                Only vendor invoices and store receipts count toward this
                cap—not quotes, estimates, or permits.
              </Text>
            ) : null}
            {reason === "export" && !isArchitect && !hasProjectPass ? (
              <Text style={styles.invoiceLimitHint}>
                The full seller packet PDF is included with Architect or a
                Project Pass. You can still browse your project on the free
                plan.
              </Text>
            ) : null}
          </MotiView>

          {loading ? (
            <View
              style={[styles.noticeCard, styles.noticeRow]}
              accessibilityLabel="Loading subscription plans"
            >
              <ActivityIndicator color={Theme.colors.brand.primary} />
              <Text style={styles.noticeBody}>Loading plans…</Text>
            </View>
          ) : null}

          {offeringsError ? (
            <View style={[styles.noticeCard, styles.noticeCardError]}>
              <Text style={styles.noticeTitle}>We couldn’t load plans</Text>
              <Text style={styles.noticeBody}>
                {PURCHASE_OFFERINGS_LOAD_ERROR}
              </Text>
              <TouchableOpacity
                onPress={() => void retryOfferings()}
                style={styles.noticeButton}
                accessibilityRole="button"
                accessibilityLabel="Try loading plans again"
              >
                <Text style={styles.noticeButtonText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {noProductsConfigured && !loading && !offeringsError ? (
            <View style={[styles.noticeCard, styles.noticeCardWarning]}>
              <Text style={styles.noticeTitle}>Plans not available yet</Text>
              <Text style={styles.noticeBody}>{PURCHASE_NO_PRODUCTS}</Text>
              <TouchableOpacity
                onPress={() => {
                  void Linking.openURL(PUBLIC_SUPPORT_PAGE_URL);
                }}
                style={styles.noticeButton}
                accessibilityRole="link"
                accessibilityLabel="Open help and support in browser"
              >
                <Text style={styles.noticeButtonText}>Open help center</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
              {isArchitect ? (
                <Text style={styles.currentPlanPill}>Current plan</Text>
              ) : null}
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
              {hasProjectPass ? (
                <Text style={styles.currentPlanPillPass}>Current plan</Text>
              ) : null}
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
                (isPurchasing || !canPurchase || selectionMatchesCurrentPlan) &&
                  styles.continueButtonDisabled,
              ]}
              disabled={
                isPurchasing || !canPurchase || selectionMatchesCurrentPlan
              }
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
                    Alert.alert("Plan unavailable", PURCHASE_PACKAGE_MISSING, [
                      { text: "OK" },
                    ]);
                  }
                } catch {
                  Alert.alert(
                    "Purchase didn’t go through",
                    PURCHASE_FAILED_GENERIC,
                    [{ text: "OK" }],
                  );
                } finally {
                  setIsPurchasing(false);
                }
              }}
            >
              <Text style={styles.continueButtonText}>
                {selectionMatchesCurrentPlan
                  ? "Current plan"
                  : isPurchasing
                    ? "Securing plan…"
                    : "Continue"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => void handleRestore()}
              disabled={isRestoring}
            >
              <Text style={styles.restoreText}>
                {isRestoring ? "Restoring…" : "Restore purchases"}
              </Text>
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
  currentPlanPill: {
    marginTop: 10,
    alignSelf: "flex-start",
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.status.success,
  },
  currentPlanPillPass: {
    marginTop: 10,
    alignSelf: "flex-start",
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.status.success,
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
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noticeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.card,
    gap: 8,
  },
  noticeCardError: {
    borderColor: "rgba(220, 38, 38, 0.25)",
    backgroundColor: "rgba(254, 242, 242, 0.6)",
  },
  noticeCardWarning: {
    borderColor: "rgba(217, 119, 6, 0.3)",
    backgroundColor: "rgba(255, 251, 235, 0.8)",
  },
  noticeTitle: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  noticeBody: {
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 20,
  },
  noticeButton: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  noticeButtonText: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.primary,
  },
});
