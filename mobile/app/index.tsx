import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import {
  ArrowRight,
  UserPlus,
  Hammer,
  ShieldCheck,
  TrendingUp,
} from "lucide-react-native";
import { GlassCard } from "../src/components/ui/GlassCard";
import { Button } from "../src/components/ui/Button";
import { ScreenWrapper } from "../src/components/ScreenWrapper";
import { Logo } from "../src/components/ui/Logo";

export default function LandingScreen() {
  return (
    <ScreenWrapper withScroll edges={["top", "bottom", "left", "right"]}>
      <View style={styles.scrollContent}>
        {/* Hero Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, type: "timing", duration: 800 }}
          style={styles.hero}
        >
          <View style={styles.logoContainer}>
            <Logo size={80} />
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
            <Button
              title="Start Free Estimate"
              onPress={() => router.push("/(auth)/register")}
              icon={<ArrowRight size={20} color="white" />}
            />
            <View style={{ height: 12 }} />
            <Button
              title="Sign In"
              variant="outline"
              onPress={() => router.push("/(auth)/login")}
              icon={<UserPlus size={20} color="#0f172a" />}
            />
          </View>
        </MotiView>

        {/* Value Props */}
        <View style={styles.features}>
          <FeatureCard
            icon={<Hammer size={24} color="#4f46e5" />}
            title="AI Cost Analysis"
            description="Regionally grounded pricing for labor and materials."
            delay={400}
          />
          <FeatureCard
            icon={<ShieldCheck size={24} color="#10b981" />}
            title="Secure Records"
            description="Keep all receipts, warranties, and permits in one place."
            delay={500}
          />
          <FeatureCard
            icon={<TrendingUp size={24} color="#f59e0b" />}
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
      <GlassCard intensity={20}>
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
    paddingTop: 60,
  },
  hero: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  badgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontFamily: "Outfit_700Bold",
    letterSpacing: 2,
  },
  title: {
    fontSize: 36,
    fontFamily: "Outfit_700Bold",
    color: "white",
    textAlign: "center",
    lineHeight: 42,
  },
  highlightTitle: {
    fontSize: 36,
    fontFamily: "Outfit_700Bold",
    color: "#cbd5e1",
    textAlign: "center",
    lineHeight: 42,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
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
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: "Outfit_700Bold",
    color: "white",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#94a3b8",
    fontFamily: "Outfit_400Regular",
  },
});
