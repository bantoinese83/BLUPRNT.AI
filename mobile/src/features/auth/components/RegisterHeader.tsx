import React from "react";
import { StyleSheet, Text } from "react-native";
import { MotiView } from "moti";
import { Theme } from "@/constants/Theme";

export function RegisterHeader() {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 800 }}
      style={styles.header}
    >
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join BLUPRNT today</Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32,
    marginTop: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 34,
    fontFamily: "Outfit_800ExtraBold",
    color: Theme.colors.text.primary,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
});
