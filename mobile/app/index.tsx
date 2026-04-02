import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import {
  ArrowRight,
  Hammer,
  ShieldCheck,
  TrendingUp,
} from "lucide-react-native";
import { Button } from "../src/components/ui/Button";
import { ScreenWrapper } from "../src/components/ScreenWrapper";
import { Logo } from "../src/components/ui/Logo";
import { Theme } from "../src/constants/Theme";
import * as Haptics from "expo-haptics";

export default function LandingScreen() {
  const [activeSlide, setActiveSlide] = React.useState(0);

  const slides = [
    {
      title: "Scan. See. Save.",
      highlight: "Professional AI Analysis",
      subtitle:
        "Snap a photo of any room. Our AI extracts a bill of materials and regional labor costs in seconds. Stop guessing, start building.",
      icon: <Hammer size={32} color={Theme.colors.brand.primary} />,
      badge: "AI VISION",
    },
    {
      title: "The Property Ledger",
      highlight: "Every Quote, Verified.",
      subtitle:
        "Track invoices and receipts against your AI-hardened budget. We extract the data so you can see your project health at a glance.",
      icon: <ShieldCheck size={32} color={Theme.colors.status.success} />,
      badge: "FINANCIAL CONTROL",
    },
    {
      title: "Lender Ready.",
      highlight: "Data Bankers Trust.",
      subtitle:
        "Export professional reports that accelerate loan approvals and permits. AI-validated data gives you immediate credibility.",
      icon: <ShieldCheck size={32} color={Theme.colors.brand.primary} />,
      badge: "PROFESSIONAL GRADE",
    },
    {
      title: "Sold for More.",
      highlight: "Capture Every Dollar.",
      subtitle:
        "When you're ready to move, generate a professional Seller Packet that proves every dollar of equity you've built to buyers.",
      icon: <TrendingUp size={32} color={Theme.colors.status.warning} />,
      badge: "EQUITY BUILDING",
    },
  ];

  const nextSlide = () => {
    Haptics.selectionAsync();
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[activeSlide];

  return (
    <ScreenWrapper
      withScroll={false}
      withTabBar={false}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.container}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                {
                  backgroundColor:
                    i === activeSlide
                      ? Theme.colors.brand.primary
                      : "rgba(0,0,0,0.05)",
                },
              ]}
            />
          ))}
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Logo size={60} />
          </View>

          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={activeSlide}
              from={{ opacity: 0, translateX: 50 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -50 }}
              transition={{ type: "timing", duration: 400 }}
              style={styles.slideContent}
            >
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{slide.badge}</Text>
              </View>

              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.highlightTitle}>{slide.highlight}</Text>

              <Text style={styles.subtitle}>{slide.subtitle}</Text>

              <View style={styles.slideIconContainer}>{slide.icon}</View>
            </MotiView>
          </AnimatePresence>
        </View>

        {/* CTA Container */}
        <View style={styles.ctaContainer}>
          <Button
            title={activeSlide === slides.length - 1 ? "Get Started" : "Next"}
            onPress={() => {
              if (activeSlide === slides.length - 1) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/onboarding");
              } else {
                nextSlide();
              }
            }}
            icon={<ArrowRight size={20} color="white" />}
          />
          <View style={{ height: 12 }} />
          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(auth)/login");
            }}
          >
            <Text style={styles.signInText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 20 : 40,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  hero: {
    flex: 1,
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: 40,
  },
  slideContent: {
    alignItems: "center",
    width: "100%",
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
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: Theme.colors.brand.primary,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Outfit_400Regular",
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  slideIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 20,
  },
  ctaContainer: {
    width: "100%",
    paddingBottom: 20,
  },
  signInLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: Theme.colors.text.secondary,
  },
});
