import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import {
  ArrowRight,
  Hammer,
  ShieldCheck,
  TrendingUp,
} from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Logo } from "@/components/ui/Logo";
import { Theme } from "@/constants/Theme";
import * as Haptics from "expo-haptics";

export default function LandingScreen() {
  const [activeSlide, setActiveSlide] = React.useState(0);

  const slides = [
    {
      title: "Snap the room. Get the number.",
      highlight: "See a budget range before contractors bid",
      subtitle:
        "Add one room photo and your location. We show a planning range from local cost data so you can compare quotes instead of guessing.",
      icon: <Hammer size={32} color={Theme.colors.brand.primary} />,
      badge: "SMART ESTIMATE",
    },
    {
      title: "Your home file",
      highlight: "Planned vs. paid, side by side",
      subtitle:
        "Drop in invoices and quotes; we pull the totals so you can see if the job is still on track.",
      icon: <ShieldCheck size={32} color={Theme.colors.status.success} />,
      badge: "STAY ON BUDGET",
    },
    {
      title: "Paperwork, packaged.",
      highlight: "One PDF when they ask",
      subtitle:
        "Bundle what you spent and what you changed into a clean download—handy for lenders or agents, not a promise they’ll say yes.",
      icon: <ShieldCheck size={32} color={Theme.colors.brand.primary} />,
      badge: "SHARE READY",
    },
    {
      title: "Time to move on?",
      highlight: "Show what you improved",
      subtitle:
        "Export a simple packet that tells the story of your remodel—buyers still do their own homework.",
      icon: <TrendingUp size={32} color={Theme.colors.status.warning} />,
      badge: "LIST SMARTER",
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
        >
          {/* Progress bars */}
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
        </ScrollView>

        {/* Footer below scroll — layout order guarantees no overlap with icon */}
        <View style={styles.footer}>
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
            testID="landing-sign-in-link"
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
    paddingHorizontal: Theme.spacing.margin,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: Theme.spacing.lg,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 40,
    width: "100%",
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  logoContainer: {
    marginBottom: 40,
  },
  slideContent: {
    alignItems: "center",
    width: "100%",
  },
  badgeContainer: {
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },
  badgeText: {
    color: Theme.colors.brand.primary,
    fontSize: 10,
    fontFamily: Theme.typography.family.bold,
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -1,
  },
  highlightTitle: {
    fontSize: 24,
    fontFamily: Theme.typography.family.bold,
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
    fontFamily: Theme.typography.family.regular,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  slideIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Theme.colors.card,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 20,
  },
  footer: {
    width: "100%",
    paddingTop: Theme.spacing.md,
    paddingBottom: 20,
  },
  signInLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 14,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.secondary,
  },
});
