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
import { ArrowLeft, Shield } from "lucide-react-native";
import { MotiView } from "moti";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Theme } from "@/constants/Theme";
import { reportClientError } from "@/lib/sentry";
import { PUBLIC_PRIVACY_POLICY_URL } from "@shared/constants/public-site";

export default function PrivacyScreen() {
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
          <Shield size={32} color={Theme.colors.brand.primary} />
        </View>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>
          Summary — see website for full policy
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
            title="1. Information we collect"
            content="We collect information you provide directly to us when you create an account, use our tools, or upload construction-related documents. This includes your name, email address, and any project-related data you choose to share with BLUPRNT."
          />
          <Section
            title="2. How we use information"
            content="We use the information we collect to operate, maintain, and provide the features of BLUPRNT, including project estimation, document handling, and related services. We also use your data to communicate with you about updates and support."
          />
          <Section
            title="3. Data security"
            content="We implement industry-standard security measures to protect your personal and project information. Data is stored using providers such as Supabase and encrypted in transit. No method of transmission over the internet is completely secure."
          />
          <Section
            title="4. Sharing of information"
            content="We do not sell your personal information. We may share data with third-party service providers (such as Stripe for payments) strictly as needed to provide our services to you."
          />
          <Section
            title="5. Your choices"
            content="You can access, update, or delete your account information through your dashboard settings where available. If you have questions about your data, contact us at connect@monarch-labs.com."
          />
          <TouchableOpacity
            style={styles.externalLink}
            onPress={() =>
              void Linking.openURL(PUBLIC_PRIVACY_POLICY_URL).catch(
                (err: unknown) =>
                  reportClientError("open_external_privacy_policy", err),
              )
            }
            accessibilityRole="link"
            accessibilityLabel="Open full privacy policy on bluprnt.ai"
          >
            <Text style={styles.externalLinkText}>
              Read the full Privacy Policy on bluprnt.ai →
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
