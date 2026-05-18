import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { usePremium } from "@/hooks/usePremium";
import {
  PURCHASE_NO_PRODUCTS,
  PURCHASE_OFFERINGS_LOAD_ERROR,
} from "@/lib/purchase-messages";
import { PUBLIC_SUPPORT_PAGE_URL } from "@shared/constants/public-site";
import { router } from "expo-router";

// Sub-components
import { UpgradeHero } from "./upgrade/UpgradeHero";
import { UpgradeFeatures } from "./upgrade/UpgradeFeatures";
import { UpgradePlanSelection } from "./upgrade/UpgradePlanSelection";

// Sub-hooks
import { useUpgradeActions } from "./upgrade/useUpgradeActions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: "general" | "ledger_limit" | "export";
  /** When true, monthly (Architect) is already active — align with web paywall. */
  isArchitect?: boolean;
  hasProjectPass?: boolean;
  /** Current project — required for Project Pass (lifetime) purchase sync. */
  projectId?: string;
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason = "general",
  isArchitect = false,
  hasProjectPass = false,
  projectId,
}: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "projectPass">(
    "monthly",
  );

  const premium = usePremium();
  const {
    packages,
    loading,
    offeringsError,
    noProductsConfigured,
    retryOfferings,
    purchase,
    restore,
  } = premium;

  const { isPurchasing, isRestoring, handlePurchase, handleRestore } =
    useUpgradeActions(onClose, { purchase, packages, restore, projectId });

  const hasStorePackages = packages.length > 0;
  const showOfferingsError = offeringsError && !loading && !hasStorePackages;
  const canPurchase = !loading && hasStorePackages && !noProductsConfigured;

  useEffect(() => {
    if (isOpen) {
      void retryOfferings();
    }
  }, [isOpen, retryOfferings]);

  const architectEntitled = isArchitect || premium.isPro;

  useEffect(() => {
    if (!isOpen) return;
    if (reason === "ledger_limit" && !architectEntitled && projectId) {
      setSelectedPlan("projectPass");
    } else if (reason === "ledger_limit" && !architectEntitled) {
      setSelectedPlan("monthly");
    }
  }, [isOpen, reason, architectEntitled, projectId]);

  const selectionMatchesCurrentPlan =
    (selectedPlan === "monthly" && architectEntitled) ||
    (selectedPlan === "projectPass" && hasProjectPass);

  const continueLabel = selectionMatchesCurrentPlan
    ? "Current plan"
    : isPurchasing
      ? "Securing plan…"
      : reason === "ledger_limit"
        ? "Unlock more uploads"
        : reason === "export"
          ? "Unlock full export"
          : "Continue";

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
          <UpgradeHero
            selectedPlan={selectedPlan}
            reason={reason}
            isArchitect={architectEntitled}
            hasProjectPass={hasProjectPass}
          />

          {loading && (
            <View
              style={[styles.noticeCard, styles.noticeRow]}
              accessibilityLabel="Loading subscription plans"
            >
              <ActivityIndicator color={Theme.colors.brand.primary} />
              <Text style={styles.noticeBody}>Loading plans…</Text>
            </View>
          )}

          {showOfferingsError && (
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
          )}

          {noProductsConfigured && !loading && !showOfferingsError && (
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
          )}

          <UpgradePlanSelection
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            isArchitect={architectEntitled}
            hasProjectPass={hasProjectPass}
            packages={packages}
          />

          <UpgradeFeatures />

          <View style={styles.footer}>
            <Text style={styles.priceHint}>
              Subscriptions auto-renew and can be cancelled any time in your
              Apple ID settings. Payment is charged to your Apple ID account.
              The final price is shown in the App Store confirmation.
            </Text>

            <View style={styles.legalLinks}>
              <TouchableOpacity
                onPress={() => router.push("/privacy")}
                accessibilityRole="link"
                accessibilityLabel="Privacy Policy"
              >
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalDot}>·</Text>
              <TouchableOpacity
                onPress={() => router.push("/terms")}
                accessibilityRole="link"
                accessibilityLabel="Terms of Use"
              >
                <Text style={styles.legalLinkText}>Terms of Use</Text>
              </TouchableOpacity>
              <Text style={styles.legalDot}>·</Text>
              <TouchableOpacity
                onPress={() => void Linking.openURL(PUBLIC_SUPPORT_PAGE_URL)}
                accessibilityRole="link"
                accessibilityLabel="Help and support"
              >
                <Text style={styles.legalLinkText}>Support</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                (isPurchasing || !canPurchase || selectionMatchesCurrentPlan) &&
                  styles.continueButtonDisabled,
              ]}
              disabled={
                isPurchasing || !canPurchase || selectionMatchesCurrentPlan
              }
              onPress={() => void handlePurchase(selectedPlan)}
              accessibilityRole="button"
              accessibilityLabel={continueLabel}
              accessibilityState={{
                disabled:
                  isPurchasing || !canPurchase || selectionMatchesCurrentPlan,
              }}
            >
              <Text style={styles.continueButtonText}>{continueLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => void handleRestore()}
              disabled={isRestoring}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
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
  footer: {
    alignItems: "center",
  },
  priceHint: {
    fontSize: 11,
    color: Theme.colors.text.muted,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 16,
    paddingHorizontal: 40,
  },
  legalLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  legalLinkText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.brand.primary,
  },
  legalDot: {
    fontSize: 12,
    color: Theme.colors.text.muted,
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
