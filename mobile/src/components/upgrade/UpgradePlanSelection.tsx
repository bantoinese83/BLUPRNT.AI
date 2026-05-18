import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { PurchasesPackage } from "react-native-purchases";
import { Theme } from "@/constants/Theme";
import { PRICING } from "@shared/constants/pricing";
import {
  findUpgradePackage,
  formatPackagePrice,
} from "@/lib/revenuecat-packages";
import { ArchitectPlanIcon, ProjectPassIcon } from "../icons/PlanMarks";

interface UpgradePlanSelectionProps {
  selectedPlan: "monthly" | "projectPass";
  setSelectedPlan: (plan: "monthly" | "projectPass") => void;
  isArchitect: boolean;
  hasProjectPass: boolean;
  packages?: PurchasesPackage[];
}

export function UpgradePlanSelection({
  selectedPlan,
  setSelectedPlan,
  isArchitect,
  hasProjectPass,
  packages = [],
}: UpgradePlanSelectionProps) {
  const monthlyPkg = findUpgradePackage(packages, "monthly");
  const passPkg = findUpgradePackage(packages, "projectPass");
  const monthlyPrice =
    (monthlyPkg && formatPackagePrice(monthlyPkg)) ??
    `$${PRICING.architectUsdPerMonth}`;
  const passPrice =
    (passPkg && formatPackagePrice(passPkg)) ??
    `$${PRICING.projectPassUsdOneTime}`;

  return (
    <View
      style={styles.plansContainer}
      accessibilityRole="radiogroup"
      accessibilityLabel="Choose a plan"
    >
      <TouchableOpacity
        style={[
          styles.planCard,
          selectedPlan === "monthly" && styles.planCardActive,
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setSelectedPlan("monthly");
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected: selectedPlan === "monthly" }}
        accessibilityLabel={`Architect monthly plan, ${monthlyPrice}`}
      >
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <ArchitectPlanIcon size={22} />
            <Text style={styles.planName}>Architect — monthly</Text>
          </View>
          {selectedPlan === "monthly" && (
            <Check size={18} color={Theme.colors.brand.primary} />
          )}
        </View>
        <Text style={styles.planTierHint}>
          Full app access (Architect tier)
        </Text>
        <Text style={styles.planPrice}>
          {monthlyPrice}
          {!monthlyPkg && <Text style={styles.planPeriod}>/mo</Text>}
        </Text>
        <Text style={styles.planTagline}>Best for active renovations</Text>
        {isArchitect && (
          <Text style={styles.currentPlanPill}>Current plan</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.planCard,
          selectedPlan === "projectPass" && styles.planCardActive,
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setSelectedPlan("projectPass");
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected: selectedPlan === "projectPass" }}
        accessibilityLabel={`Project Pass, ${passPrice}`}
      >
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <ProjectPassIcon size={22} />
            <Text style={styles.planName}>Project Pass</Text>
          </View>
          {selectedPlan === "projectPass" && (
            <Check size={18} color={Theme.colors.brand.primary} />
          )}
        </View>
        <Text style={styles.planPrice}>
          {passPrice}
          {!passPkg && <Text style={styles.planPeriod}> once</Text>}
        </Text>
        <Text style={styles.planTagline}>
          6 months of full tools for one job · then view-only while BLUPRNT is
          available.
        </Text>
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
        {hasProjectPass && (
          <Text style={styles.currentPlanPillPass}>Current plan</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  plansContainer: {
    gap: 16,
    marginBottom: 32,
  },
  planCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  planCardActive: {
    borderColor: Theme.colors.brand.primary,
    backgroundColor: "rgba(13, 148, 136, 0.03)",
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  planName: {
    fontSize: 15,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
  },
  planTierHint: {
    fontSize: 11,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
    marginBottom: 6,
    lineHeight: 14,
  },
  planPrice: {
    fontSize: 24,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.brand.primary,
    marginBottom: 2,
  },
  planPeriod: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    fontFamily: Theme.typography.family.regular,
  },
  planTagline: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: Theme.colors.text.muted,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: Theme.colors.brand.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    color: "white",
    fontSize: 9,
    fontFamily: Theme.typography.family.black,
    letterSpacing: 1,
  },
  currentPlanPill: {
    marginTop: 10,
    alignSelf: "flex-start",
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.status.success,
  },
  currentPlanPillPass: {
    marginTop: 10,
    alignSelf: "flex-start",
    fontSize: 12,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.status.success,
  },
});
