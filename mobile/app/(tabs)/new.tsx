import React, { useEffect } from "react";
import { Text, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { Logo } from "../../src/components/ui/Logo";
import { Theme } from "../../src/constants/Theme";

/**
 * Center tab: send users into onboarding for another project, with clear feedback
 * so the jump never feels like a dead tap.
 */
export default function NewProjectRedirect() {
  useEffect(() => {
    router.replace("/onboarding?newProject=1");
  }, []);

  return (
    <ScreenWrapper
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      edges={["top", "bottom", "left", "right"]}
    >
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 320 }}
        style={styles.inner}
      >
        <Logo size={52} />
        <Text style={styles.title}>New project</Text>
        <Text style={styles.subtitle}>
          Opening the builder so you can add another renovation.
        </Text>
        <ActivityIndicator
          size="small"
          color={Theme.colors.brand.primary}
          style={styles.spinner}
        />
      </MotiView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: "center",
    paddingHorizontal: 32,
    maxWidth: 320,
  },
  title: {
    marginTop: 20,
    fontSize: 22,
    fontFamily: "Outfit_800ExtraBold",
    color: Theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  spinner: {
    marginTop: 24,
  },
});
