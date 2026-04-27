import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { ArchitectPlanIcon, ProjectPassIcon } from "../icons/PlanMarks";
import { Theme } from "@/constants/Theme";
import { FREE_TIER_BILL_RECEIPT_LIMIT } from "@shared/lib/ledger-entry-quota";

const ARCHITECT_INVOICE_LIMIT = 10;

interface UpgradeHeroProps {
  selectedPlan: "monthly" | "projectPass";
  reason: "general" | "invoice_limit" | "export";
  isArchitect: boolean;
  hasProjectPass: boolean;
}

export function UpgradeHero({
  selectedPlan,
  reason,
  isArchitect,
  hasProjectPass,
}: UpgradeHeroProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 800 }}
      style={styles.hero}
    >
      <View style={styles.heroIconBadge}>
        {selectedPlan === "monthly" ? (
          <ArchitectPlanIcon size={40} />
        ) : (
          <ProjectPassIcon size={40} />
        )}
      </View>
      <Text style={styles.heroTitle}>Level up your remodel file</Text>
      <Text style={styles.heroSubtitle}>
        {reason === "export" && (isArchitect || hasProjectPass)
          ? "You already have full access to exports and premium tools on this account."
          : reason === "invoice_limit" && isArchitect
            ? `You’ve used your ${ARCHITECT_INVOICE_LIMIT} bill or receipt uploads for this billing period. Your limit resets when your subscription renews.`
            : reason === "invoice_limit" && hasProjectPass
              ? "You’ve reached the upload limit for this project while your Project Pass is active."
              : reason === "invoice_limit"
                ? `You’ve used all ${FREE_TIER_BILL_RECEIPT_LIMIT} free bill or receipt uploads on this project. Upgrade to add more anytime.`
                : reason === "export"
                  ? "Upgrade to Architect to build full PDF packets and your complete home file."
                  : "Keep budgets, photos of records, and one-tap exports in a single place—built for homeowners."}
      </Text>
      {reason === "invoice_limit" && (
        <Text style={styles.invoiceLimitHint}>
          Only vendor records and store receipts count toward this cap—not
          quotes, estimates, or permits.
        </Text>
      )}
      {reason === "export" && !isArchitect && !hasProjectPass && (
        <Text style={styles.invoiceLimitHint}>
          The full seller packet PDF is included with Architect or a Project
          Pass. You can still browse your project on the free plan.
        </Text>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    marginBottom: 40,
  },
  heroIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.15)",
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  invoiceLimitHint: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 24,
  },
});
