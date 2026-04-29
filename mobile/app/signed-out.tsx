import { useEffect } from "react";
import { StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Theme } from "@/constants/Theme";
import { useAuth } from "@/contexts/auth-context";
import { getPostAuthRedirectHref } from "@/lib/onboarding-draft";

/**
 * Shown after the session ends while the user was inside the app shell
 * (tabs, project, onboarding, etc.). Gives a clear moment before the landing carousel.
 */
export default function SignedOutScreen() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading || !session) return;
    let cancelled = false;
    void getPostAuthRedirectHref().then((href) => {
      if (!cancelled) router.replace(href);
    });
    return () => {
      cancelled = true;
    };
  }, [session, loading]);

  if (loading || session) {
    return (
      <ScreenWrapper
        withScroll={false}
        withTabBar={false}
        edges={["top", "bottom", "left", "right"]}
      >
        <View style={styles.bootWrap} accessibilityLabel="Loading">
          <Logo size={56} />
          <ActivityIndicator
            color={Theme.colors.brand.primary}
            style={styles.bootSpinner}
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      withScroll={false}
      withTabBar={false}
      edges={["top", "bottom", "left", "right"]}
    >
      <View style={styles.root}>
        <View style={styles.center}>
          <Logo size={64} />
          <Text style={styles.title} accessibilityRole="header">
            {"You're signed out"}
          </Text>
          <Text style={styles.body}>
            {
              "Thanks for stopping by. Sign in again to continue with your projects, or go to the welcome screen to start fresh."
            }
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            testID="signed-out-continue"
            title="Continue"
            titleCase="sentence"
            onPress={() => {
              router.replace("/");
            }}
            accessibilityLabel="Continue to welcome screen"
          />
          <Button
            title="Sign in"
            variant="outline"
            titleCase="sentence"
            onPress={() => {
              router.replace("/(auth)/login");
            }}
            accessibilityLabel="Open sign in"
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  bootWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 24,
  },
  bootSpinner: { marginTop: 4 },
  root: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontFamily: Theme?.typography?.family?.bold || "System",
    fontSize: Theme?.typography?.size?.xxl || 24,
    color: Theme?.colors?.text?.primary || "#000",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: Theme?.typography?.family?.regular || "System",
    fontSize: Theme?.typography?.size?.lg || 16,
    lineHeight: 24,
    color: Theme?.colors?.text?.secondary || "#666",
    textAlign: "center",
    maxWidth: 340,
  },
  actions: {
    gap: 12,
  },
});
