import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, FileText } from "lucide-react-native";
import { MotiView } from "moti";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Theme } from "@/constants/Theme";

export default function TermsScreen() {
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
          <FileText size={32} color={Theme.colors.brand.primary} />
        </View>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.subtitle}>
          Summary — see website for full terms
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
          transition={{ delay: 200 }}
        >
          <Section
            title="1. Agreement to terms"
            content="By accessing or using BLUPRNT, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services."
          />
          <Section
            title="2. Description of service"
            content="BLUPRNT provides a platform for construction document handling, project estimation, and financial tracking for homeowners. We reserve the right to modify or discontinue any part of our service."
          />
          <Section
            title="3. User accounts"
            content="You are responsible for maintaining the security of your account and password. BLUPRNT cannot be liable for any loss or damage from your failure to comply with this security obligation."
          />
          <Section
            title="4. Payments"
            content="Payments are processed securely through Stripe. Subscriptions renew automatically unless cancelled. One-time purchases are non-refundable once analysis or access has been provided."
          />
          <Section
            title="5. Intellectual property"
            content="The software and interface of BLUPRNT are the property of our company. You retain ownership of the documents you upload."
          />
          <Section
            title="6. Limitation of liability"
            content="BLUPRNT provides estimates and summaries for informational purposes. Construction costs and resale values are subject to market conditions. We are not responsible for architectural or financial decisions made based on product output."
          />
          <Section
            title="7. Data rights (GDPR & CCPA)"
            content="Under various global privacy regulations, including GDPR and CCPA, users have specific rights regarding their personal data, including access, export, and deletion of project records."
          />
          <TouchableOpacity
            style={styles.externalLink}
            onPress={() =>
              Linking.openURL("https://bluprnt.ai/terms").catch(() => {})
            }
            accessibilityRole="link"
            accessibilityLabel="Open full terms of service on bluprnt.ai"
          >
            <Text style={styles.externalLinkText}>
              Read the full Terms on bluprnt.ai →
            </Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </ScreenWrapper>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Theme.spacing.margin,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.lg,
  },
  backText: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.size.xxl,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs / 2,
  },
  subtitle: {
    fontSize: Theme.typography.size.sm,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.margin,
    paddingBottom: 40,
    maxWidth: Theme.layout.readingMaxWidth,
    width: "100%",
    alignSelf: "center",
  },
  section: {
    marginBottom: Theme.spacing.margin,
  },
  sectionTitle: {
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  sectionContent: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 24,
  },
  externalLink: {
    marginTop: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.radius.lg,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.25)",
  },
  externalLinkText: {
    fontSize: Theme.typography.size.sm,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.brand.primary,
    textAlign: "center",
  },
});
