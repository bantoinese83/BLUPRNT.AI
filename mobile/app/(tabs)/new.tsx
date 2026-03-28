import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";

/**
 * NEW PROJECT REDIRECTOR
 * This screen is part of the central tab bar action.
 * As soon as the user taps the center "Plus" tab, they are redirected
 * into the full-screen onboarding flow.
 */
export default function NewProjectRedirect() {
  useEffect(() => {
    // Immediate redirect to onboarding
    router.push("/onboarding");
  }, []);

  return (
    <ScreenWrapper
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ActivityIndicator size="large" color="#4f46e5" />
    </ScreenWrapper>
  );
}
