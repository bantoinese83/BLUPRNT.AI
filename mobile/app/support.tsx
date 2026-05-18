import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, HelpCircle, Mail, ChevronDown } from "lucide-react-native";
import { MotiView } from "moti";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Theme } from "@/constants/Theme";
import { reportClientError } from "@/lib/sentry";
import {
  PUBLIC_SUPPORT_EMAIL,
  PUBLIC_SUPPORT_PAGE_URL,
} from "@shared/constants/public-site";

const FAQS = [
  {
    q: "Why don’t I see prices or plans in the app?",
    a: "After App Store or subscription setup, it can take a few hours for plans to appear. Check your network, try Restore purchases, or use Email support. If you’re setting up a new app, confirm Paid Apps and subscriptions are active in App Store Connect.",
  },
  {
    q: "How does the AI estimate work?",
    a: "BLUPRNT uses your photos and project details to suggest scope lines and regional cost ranges. Treat numbers as a planning guide—always compare with local quotes.",
  },
  {
    q: "Can I use my subscription on web and mobile?",
    a: "Yes. Architect can sync across devices. If you subscribed on the web (Stripe) and in the iOS App Store, you might be billed twice—cancel one where you bought it.",
  },
  {
    q: "How do I get a refund?",
    a: "For App Store purchases, use Apple’s subscription management or refund flow. For web (Stripe) purchases, email support and we’ll help.",
  },
  {
    q: "How do I link invoice lines to my budget?",
    a: "Open a document from the Ledger tab, then choose a budget line for each extracted line. That powers plan vs actual in your project.",
  },
] as const;

export default function SupportScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <ScreenWrapper withTabBar={false} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={Theme.colors.text.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <HelpCircle size={32} color={Theme.colors.brand.primary} />
        </View>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>
          Email us anytime — or browse quick answers below.
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
        >
          <TouchableOpacity
            style={styles.mailCard}
            onPress={() =>
              void Linking.openURL(`mailto:${PUBLIC_SUPPORT_EMAIL}`).catch(
                (err: unknown) => reportClientError("support_mailto", err),
              )
            }
            accessibilityRole="button"
            accessibilityLabel={`Email ${PUBLIC_SUPPORT_EMAIL}`}
          >
            <Mail size={22} color={Theme.colors.brand.primary} />
            <View style={styles.mailTextWrap}>
              <Text style={styles.mailTitle}>Email support</Text>
              <Text style={styles.mailSubtitle}>{PUBLIC_SUPPORT_EMAIL}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() =>
              void Linking.openURL(PUBLIC_SUPPORT_PAGE_URL).catch(
                (err: unknown) => reportClientError("support_open_web", err),
              )
            }
          >
            <Text style={styles.linkCardText}>
              Open full help center on bluprntai.com →
            </Text>
          </TouchableOpacity>

          <Text style={styles.faqHeading}>Common questions</Text>
          {FAQS.map((item, i) => {
            const open = openFaq === i;
            return (
              <TouchableOpacity
                key={item.q}
                style={styles.faqRow}
                onPress={() => setOpenFaq(open ? null : i)}
                activeOpacity={0.85}
              >
                <View style={styles.faqQRow}>
                  <Text style={styles.faqQ}>{item.q}</Text>
                  <ChevronDown
                    size={18}
                    color={Theme.colors.text.secondary}
                    style={{
                      transform: [{ rotate: open ? "180deg" : "0deg" }],
                    }}
                  />
                </View>
                {open ? <Text style={styles.faqA}>{item.a}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </MotiView>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Theme.spacing.lg,
  },
  backText: {
    fontSize: 15,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Theme.colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.size.xxl,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 22,
  },
  content: { flex: 1 },
  scrollContent: {
    padding: Theme.spacing.xl,
    paddingTop: Theme.spacing.sm,
    paddingBottom: 48,
  },
  mailCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  mailTextWrap: { flex: 1 },
  mailTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  mailSubtitle: {
    fontSize: 14,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.brand.primary,
    marginTop: 4,
  },
  linkCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: Theme.spacing.xl,
  },
  linkCardText: {
    fontSize: 15,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.brand.primary,
  },
  faqHeading: {
    fontSize: Theme.typography.size.xs,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: Theme.spacing.md,
  },
  faqRow: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  faqQRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  faqQ: {
    flex: 1,
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    lineHeight: 22,
  },
  faqA: {
    marginTop: Theme.spacing.sm,
    fontSize: 14,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 22,
  },
});
