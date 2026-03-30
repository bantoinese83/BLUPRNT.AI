import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Linking,
} from "react-native";
import { X, Crown, Zap, Check } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { GlassCard } from "./ui/GlassCard";
import { Theme } from "../constants/Theme";

const ARCHITECT_FEATURES = [
  "Unlimited invoice uploads",
  "AI-powered Smart Insights",
  "Seller Packet PDF export",
  "Priority support",
  "Project health analytics",
  "Budget anomaly alerts",
];

const WEB_CHECKOUT_ARCHITECT = "https://bluprnt.ai/dashboard?upgrade=architect";
const WEB_CHECKOUT_PASS = "https://bluprnt.ai/dashboard?upgrade=pass";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: "general" | "invoice_limit" | "export";
}

export function UpgradeModal({ isOpen, onClose, reason = "general" }: Props) {
  const handleUpgrade = async (plan: "architect" | "pass" = "architect") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const url = plan === "pass" ? WEB_CHECKOUT_PASS : WEB_CHECKOUT_ARCHITECT;
    try {
      await Linking.openURL(url);
      onClose();
    } catch {
      // fallback: URL couldn't open
    }
  };

  const reasonTitle =
    reason === "invoice_limit"
      ? "You've hit your invoice limit"
      : reason === "export"
        ? "Export requires Architect"
        : "Unlock the full BLUPRNT experience";

  const reasonSubtitle =
    reason === "invoice_limit"
      ? "Free accounts include 3 invoices. Upgrade to upload unlimited documents."
      : reason === "export"
        ? "Generating a Seller Packet PDF is an Architect feature."
        : "Get professional-grade tools to manage your home renovation with confidence.";

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Crown size={24} color={Theme.colors.status.warning} />
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color={Theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 300 }}
          >
            <Text style={styles.title}>{reasonTitle}</Text>
            <Text style={styles.subtitle}>{reasonSubtitle}</Text>

            {/* Price Cards */}
            <GlassCard style={styles.priceCard} intensity={20}>
              <View style={styles.priceHeader}>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>Architect Plan</Text>
                </View>
                <Zap size={20} color={Theme.colors.brand.light} />
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>$12</Text>
                <Text style={styles.pricePer}>/month</Text>
              </View>
              <Text style={styles.priceNote}>
                Unlimited projects + all features
              </Text>
            </GlassCard>

            <View style={styles.passCard}>
              <View style={styles.passBadge}>
                <Text style={styles.passBadgeText}>Project Pass</Text>
              </View>
              <View style={styles.passRight}>
                <Text style={styles.passPrice}>$9</Text>
                <Text style={styles.passPer}> one-time / project</Text>
              </View>
            </View>

            {/* Features */}
            <Text style={styles.featuresLabel}>Everything included:</Text>
            {ARCHITECT_FEATURES.map((feat, i) => (
              <MotiView
                key={feat}
                from={{ opacity: 0, translateX: -8 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: i * 40, type: "timing", duration: 250 }}
                style={styles.featureRow}
              >
                <View style={styles.featureCheck}>
                  <Check size={14} color={Theme.colors.status.success} />
                </View>
                <Text style={styles.featureText}>{feat}</Text>
              </MotiView>
            ))}

            {/* CTAs */}
            <TouchableOpacity
              style={styles.cta}
              onPress={() => handleUpgrade("architect")}
            >
              <Crown size={20} color="white" />
              <Text style={styles.ctaText}>Get Architect — $12/mo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => handleUpgrade("pass")}
            >
              <Zap size={18} color={Theme.colors.brand.light} />
              <Text style={styles.ctaSecondaryText}>
                Or get a Project Pass — $9 one-time
              </Text>
            </TouchableOpacity>
            <Text style={styles.ctaNote}>
              Opens in browser. Manage subscription anytime.
            </Text>
          </MotiView>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "88%",
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: Theme.radius.xl,
    borderTopRightRadius: Theme.radius.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.colors.border,
    borderRadius: Theme.radius.sm,
    alignSelf: "center",
    marginTop: Theme.spacing.sm,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: Theme.radius.lg,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  closeBtn: {
    // Standardized touch target (44x44)
    width: 44,
    height: 44,
    borderRadius: Theme.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Theme.spacing.xl,
    paddingBottom: 48,
  },
  title: {
    fontSize: Theme.typography.size.display,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: Theme.spacing.xs,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.muted,
    lineHeight: 22,
    marginBottom: Theme.spacing.xl,
  },
  priceCard: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    marginBottom: Theme.spacing.xl,
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  planBadge: {
    backgroundColor: "rgba(129, 140, 248, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
  },
  planBadgeText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.brand.light,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  price: {
    fontSize: 40,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -1,
  },
  pricePer: {
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginBottom: 6,
  },
  priceNote: {
    fontSize: Theme.typography.size.sm,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: 6,
  },
  featuresLabel: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: Theme.spacing.sm,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: Theme.radius.sm,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.15)",
    flexShrink: 0,
  },
  featureText: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.primary,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: Theme.spacing.xxl,
    paddingVertical: 18,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.brand.primary,
    ...Theme.shadows.brand,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  ctaText: {
    fontSize: 17,
    fontFamily: Theme.typography.family.bold,
    color: "white",
  },
  ctaSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: Theme.spacing.sm,
    paddingVertical: 14,
    borderRadius: Theme.radius.lg,
    backgroundColor: "rgba(129, 140, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
  },
  ctaSecondaryText: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.brand.light,
  },
  passCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.radius.lg,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 14,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  passBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  passBadgeText: {
    fontSize: 11,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.status.success,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  passRight: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  passPrice: {
    fontSize: Theme.typography.size.xxl,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
  },
  passPer: {
    fontSize: Theme.typography.size.sm,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  ctaNote: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.sm,
  },
});
