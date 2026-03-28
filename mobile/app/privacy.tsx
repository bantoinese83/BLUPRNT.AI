import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Shield } from "lucide-react-native";
import { MotiView } from "moti";
import { ScreenWrapper } from "../src/components/ScreenWrapper";

export default function PrivacyScreen() {
  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color="#94a3b8" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Shield size={32} color="#818cf8" />
        </View>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>Last updated: October 2023</Text>
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
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#94a3b8",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(129, 140, 248, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
    color: "white",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Outfit_400Regular",
    color: "#64748b",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Outfit_700Bold",
    color: "white",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    lineHeight: 22,
  },
});
