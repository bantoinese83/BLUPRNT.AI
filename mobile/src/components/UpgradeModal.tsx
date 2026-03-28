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

const ARCHITECT_FEATURES = [
  "Unlimited invoice uploads",
  "AI-powered Smart Insights",
  "Seller Packet PDF export",
  "Priority support",
  "Project health analytics",
  "Budget anomaly alerts",
];

const WEB_CHECKOUT_URL = "https://bluprnt.ai/dashboard?upgrade=architect";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reason?: "general" | "invoice_limit" | "export";
}

export function UpgradeModal({ isOpen, onClose, reason = "general" }: Props) {
  const handleUpgrade = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await Linking.openURL(WEB_CHECKOUT_URL);
      onClose();
    } catch {
      // fallback
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
            <Crown size={24} color="#f59e0b" />
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#64748b" />
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

            {/* Price Card */}
            <GlassCard style={styles.priceCard} intensity={20}>
              <View style={styles.priceHeader}>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>Architect Plan</Text>
                </View>
                <Zap size={20} color="#818cf8" />
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.price}>$19</Text>
                <Text style={styles.pricePer}>/month</Text>
              </View>
              <Text style={styles.priceNote}>
                or $9/project with a Project Pass
              </Text>
            </GlassCard>

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
                  <Check size={14} color="#10b981" />
                </View>
                <Text style={styles.featureText}>{feat}</Text>
              </MotiView>
            ))}

            {/* CTA */}
            <TouchableOpacity style={styles.cta} onPress={handleUpgrade}>
              <Crown size={20} color="white" />
              <Text style={styles.ctaText}>Upgrade on BLUPRNT.AI</Text>
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
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "88%",
    backgroundColor: "#0d1526",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
    letterSpacing: -0.5,
    marginBottom: 10,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    lineHeight: 22,
    marginBottom: 24,
  },
  priceCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  planBadge: {
    backgroundColor: "rgba(129, 140, 248, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
  },
  planBadgeText: {
    fontSize: 11,
    fontFamily: "Outfit_700Bold",
    color: "#818cf8",
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
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
    letterSpacing: -1,
  },
  pricePer: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
    marginBottom: 6,
  },
  priceNote: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#475569",
    marginTop: 6,
  },
  featuresLabel: {
    fontSize: 11,
    fontFamily: "Outfit_700Bold",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.15)",
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
    color: "white",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 28,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  ctaNote: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Outfit_400Regular",
    color: "#334155",
    marginTop: 12,
  },
});
