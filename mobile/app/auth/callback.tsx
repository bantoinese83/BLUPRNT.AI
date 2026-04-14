import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getPostAuthRedirectHref } from "@/lib/onboarding-draft";
import { Theme } from "@/constants/Theme";

/**
 * OAuth / email magic-link return URL (matches `getAuthRedirectUrl()`).
 * PKCE `code` exchange runs in `AuthProvider` via Linking; this screen waits for
 * a session then routes onward so cold opens to this path never hit +not-found.
 */
export default function AuthCallbackScreen() {
  useEffect(() => {
    let cancelled = false;
    const timeoutRef = {
      id: undefined as ReturnType<typeof setTimeout> | undefined,
    };
    const subRef = { current: null as { unsubscribe: () => void } | null };

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session) {
        router.replace(await getPostAuthRedirectHref());
        return;
      }

      const { data } = supabase.auth.onAuthStateChange(async (_event, next) => {
        if (cancelled || !next) return;
        subRef.current?.unsubscribe();
        subRef.current = null;
        if (timeoutRef.id) clearTimeout(timeoutRef.id);
        router.replace(await getPostAuthRedirectHref());
      });
      subRef.current = data.subscription;

      timeoutRef.id = setTimeout(() => {
        subRef.current?.unsubscribe();
        subRef.current = null;
        if (!cancelled) {
          router.replace("/(auth)/login");
        }
      }, 25_000);
    })();

    return () => {
      cancelled = true;
      if (timeoutRef.id) clearTimeout(timeoutRef.id);
      subRef.current?.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.root}>
      <ActivityIndicator
        size="large"
        color={Theme.colors.brand.primary}
        accessibilityLabel="Signing you in"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
