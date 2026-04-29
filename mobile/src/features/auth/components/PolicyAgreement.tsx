import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import {
  WEB_APP_PATH_PRIVACY,
  WEB_APP_PATH_TERMS,
} from "@shared/constants/public-site";

interface PolicyAgreementProps {
  accepted: boolean;
  onToggle: (val: boolean) => void;
}

export function PolicyAgreement({ accepted, onToggle }: PolicyAgreementProps) {
  return (
    <View style={styles.policyRow}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onToggle(!accepted);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        hitSlop={8}
      >
        <View style={[styles.policyCheck, accepted && styles.policyCheckOn]}>
          {accepted ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
        </View>
      </Pressable>
      <Text style={styles.policyText}>
        I agree to the{" "}
        <Text
          style={styles.policyLink}
          onPress={() => {
            Haptics.selectionAsync();
            router.push(WEB_APP_PATH_TERMS);
          }}
        >
          Terms
        </Text>{" "}
        and{" "}
        <Text
          style={styles.policyLink}
          onPress={() => {
            Haptics.selectionAsync();
            router.push(WEB_APP_PATH_PRIVACY);
          }}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  policyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
    backgroundColor: "rgba(15, 23, 42, 0.03)",
  },
  policyCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(15, 23, 42, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  policyCheckOn: {
    backgroundColor: Theme.colors.brand.primary,
    borderColor: Theme.colors.brand.primary,
  },
  policyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Outfit_500Medium",
    color: Theme.colors.text.secondary,
    lineHeight: 20,
  },
  policyLink: {
    color: Theme.colors.brand.primary,
    fontFamily: "Outfit_700Bold",
    textDecorationLine: "underline",
  },
});
