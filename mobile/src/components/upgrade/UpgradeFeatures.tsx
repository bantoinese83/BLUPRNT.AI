import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Bot, ShieldCheck, FileDown } from "lucide-react-native";
import { Theme } from "@/constants/Theme";

export function UpgradeFeatures() {
  const features = [
    {
      icon: <Bot size={20} color={Theme.colors.brand.primary} />,
      title: "Renovation copilot",
      desc: "Ask why the numbers moved and what to tackle next—in plain English.",
    },
    {
      icon: <ShieldCheck size={20} color={Theme.colors.status.success} />,
      title: "Living home file",
      desc: "Photo your ledger records and quotes; we read the amounts (limits vary by plan).",
    },
    {
      icon: <FileDown size={20} color={Theme.colors.status.info} />,
      title: "Listing-ready PDF",
      desc: "Download a polished packet for agents, buyers, or your own records.",
    },
  ];

  return (
    <View style={styles.featuresList}>
      {features.map((f, i) => (
        <MotiView
          key={f.title}
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{
            type: "timing",
            duration: 500,
            delay: 200 + i * 100,
          }}
          style={styles.featureItem}
        >
          <View style={styles.featureIconBg}>{f.icon}</View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        </MotiView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  featuresList: {
    gap: 24,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.inputBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    lineHeight: 18,
  },
});
