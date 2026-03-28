import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, FileText } from "lucide-react-native";
import { MotiView } from "moti";
import { ScreenWrapper } from "../src/components/ScreenWrapper";

export default function TermsScreen() {
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
          <FileText size={32} color="#818cf8" />
        </View>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.subtitle}>Effective: October 2023</Text>
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
