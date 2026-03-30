import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import {
  ArrowRight,
  UserPlus,
  Hammer,
  ShieldCheck,
  TrendingUp,
  LogIn,
} from "lucide-react-native";
import { GlassCard } from "../src/components/ui/GlassCard";
import { Button } from "../src/components/ui/Button";
import { ScreenWrapper } from "../src/components/ScreenWrapper";
import { Logo } from "../src/components/ui/Logo";
import { Theme } from "../src/constants/Theme";
import * as Haptics from "expo-haptics";

export default function LandingScreen() {
  return (
    <ScreenWrapper
      withScroll
      withTabBar={false}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.scrollContent}>
        {/* Hero Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, type: "timing", duration: 800 }}
          style={styles.hero}
        >
          <View style={styles.logoContainer}>
            <Logo size={100} />
          </View>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>AI RENOVATION PLANNER</Text>
          </View>

          <Text style={styles.title}>Every upgrade should pay you back.</Text>
          <Text style={styles.highlightTitle}>BLUPRNT makes sure it does.</Text>

          <Text style={styles.subtitle}>
            Professional home renovation planner and budget tracker. Get
            grounded cost estimates and track every invoice against your
            long-term home value.
          </Text>

          <View style={styles.ctaContainer}>
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 600, type: "timing", duration: 500 }}
            >
              <Button
                title="Start Free Estimate"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/onboarding");
                }}
                icon={<ArrowRight size={20} color="white" />}
              />
            </MotiView>
            <View style={{ height: 12 }} />
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 750, type: "timing", duration: 500 }}
            >
              <Button
                title="Sign In"
                variant="outline"
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push("/(auth)/login");
                }}
                icon={<LogIn size={20} color={Theme.colors.brand.primary} />}
              />
            </MotiView>
          </View>
        </MotiView>

        {/* Value Props */}
        <View style={styles.features}>
          <FeatureCard
            icon={<Hammer size={24} color={Theme.colors.brand.primary} />}
            title="AI Cost Analysis"
            description="Regionally grounded pricing for labor and materials."
            delay={400}
          />
          <FeatureCard
            icon={<ShieldCheck size={24} color={Theme.colors.status.success} />}
            title="Secure Records"
            description="Keep all receipts, warranties, and permits in one place."
            delay={500}
          />
          <FeatureCard
            icon={<TrendingUp size={24} color={Theme.colors.status.warning} />}
            title="Resale Value"
            description="Automatically generate a professional property ledger."
            delay={600}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "timing", duration: 600 }}
      style={{ marginBottom: 16 }}
    >
      <GlassCard intensity={15} style={styles.featureCard}>
        <View style={styles.featureRow}>
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
          </View>
        </View>
      </GlassCard>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 40 : 60, // Refined for notch
  },
  hero: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  badgeContainer: {
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.1)",
  },
  badgeText: {
    color: Theme.colors.brand.primary,
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontFamily: "Outfit_800ExtraBold",
    color: Theme.colors.text.primary,
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -1,
  },
  highlightTitle: {
    fontSize: 32,
    fontFamily: "Outfit_800ExtraBold",
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 20,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Outfit_400Regular",
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  ctaContainer: {
    width: "100%",
  },
  features: {
    marginTop: 20,
  },
  featureCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    fontFamily: "Outfit_400Regular",
  },
});
