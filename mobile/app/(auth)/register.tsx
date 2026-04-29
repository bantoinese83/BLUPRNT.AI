import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChevronLeft } from "lucide-react-native";
import { useAuth } from "@/contexts/auth-context";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Theme } from "@/constants/Theme";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import { getPostAuthRedirectHref } from "@/lib/onboarding-draft";
import { getSafeRedirect } from "@shared/lib/safe-redirect";
import {
  clearPostLoginRedirectStorage,
  persistPostLoginRedirectForOAuth,
} from "@/lib/post-login-redirect-storage";
import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
} from "@/lib/validation";
import { RegisterHeader } from "@/features/auth/components/RegisterHeader";
import { PolicyAgreement } from "@/features/auth/components/PolicyAgreement";
import { SocialAuthSection } from "@/features/auth/components/SocialAuthSection";

export default function RegisterScreen() {
  const { signInWithGoogle } = useAuth();
  const params = useLocalSearchParams<{ redirect?: string | string[] }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  const handleRegister = async () => {
    if (!acceptedPolicies) {
      Alert.alert(
        "Terms and privacy",
        "Please agree to the Terms and Privacy Policy to create an account.",
      );
      return;
    }
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMsg("Add your name so we can greet you.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMsg("Enter a valid email address.");
      return;
    }
    if (!isValidPassword(password)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMsg(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedName,
        },
      },
    });

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg(
        friendlyAuthError(
          error.message || "",
          "status" in error ? (error as { status?: number }).status : undefined,
        ),
      );
      setLoading(false);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (data.session) {
      await clearPostLoginRedirectStorage();
      const fallback = await getPostAuthRedirectHref();
      const rawRedirect = Array.isArray(params.redirect)
        ? params.redirect[0]
        : params.redirect;
      const target = rawRedirect?.trim()
        ? getSafeRedirect(rawRedirect.trim(), fallback)
        : fallback;
      setLoading(false);
      router.replace(target as never);
      return;
    }

    if (data.user) {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInData.session) {
        await clearPostLoginRedirectStorage();
        const fallback = await getPostAuthRedirectHref();
        const rawRedirect = Array.isArray(params.redirect)
          ? params.redirect[0]
          : params.redirect;
        const target = rawRedirect?.trim()
          ? getSafeRedirect(rawRedirect.trim(), fallback)
          : fallback;
        setLoading(false);
        router.replace(target as never);
        return;
      }
    }

    setLoading(false);
    const emailParam = email.trim();
    const rawRedirect = Array.isArray(params.redirect)
      ? params.redirect[0]
      : params.redirect;
    Alert.alert(
      "Check your email",
      "We sent a confirmation link. After you confirm, sign in with your password.",
      [
        {
          text: "OK",
          onPress: () => {
            const loginParams: Record<string, string> = { email: emailParam };
            if (rawRedirect?.trim()) loginParams.redirect = rawRedirect.trim();
            router.replace({
              pathname: "/(auth)/login",
              params: loginParams,
            });
          },
        },
      ],
    );
  };

  const handleGoogleLogin = async () => {
    if (!acceptedPolicies) {
      Alert.alert(
        "Terms and privacy",
        "Please agree to the Terms and Privacy Policy first.",
      );
      return;
    }
    setGoogleLoading(true);
    try {
      await persistPostLoginRedirectForOAuth(params.redirect);
      await signInWithGoogle();
    } catch (err) {
      const error = err as Error;
      Alert.alert("Google sign-in", friendlyAuthError(error.message || ""));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScreenWrapper
      withScroll
      withKeyboard
      withTabBar={false}
      edges={["top", "bottom", "left", "right"]}
      contentContainerStyle={styles.scrollContent}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BlurView
              intensity={20}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <ChevronLeft size={24} color={Theme.colors.text.primary} />
          </TouchableOpacity>

          <RegisterHeader />

          <GlassCard intensity={10} style={styles.formCard}>
            <View style={styles.form}>
              <PolicyAgreement
                accepted={acceptedPolicies}
                onToggle={setAcceptedPolicies}
              />

              <TextField
                label="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter your name"
                autoCapitalize="words"
              />

              <TextField
                label="Email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextField
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Create a password"
                secureTextEntry
              />

              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

              <Button
                title="Sign Up"
                onPress={handleRegister}
                loading={loading}
                style={{ marginTop: 8 }}
              />

              <SocialAuthSection
                googleLoading={googleLoading}
                onGoogleLogin={handleGoogleLogin}
                onAppleStart={() => {
                  setGoogleLoading(true);
                  void persistPostLoginRedirectForOAuth(params.redirect);
                }}
                onAppleSuccess={() => setGoogleLoading(false)}
                policyAccepted={acceptedPolicies}
              />
            </View>
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                const rawRedirect = Array.isArray(params.redirect)
                  ? params.redirect[0]
                  : params.redirect;
                if (rawRedirect?.trim()) {
                  router.push({
                    pathname: "/(auth)/login",
                    params: { redirect: rawRedirect.trim() },
                  });
                } else {
                  router.push("/(auth)/login");
                }
              }}
            >
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 12 : 20,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.1)",
  },
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
  formCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
  },
  form: {
    width: "100%",
  },
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },
  dividerText: {
    color: Theme.colors.text.muted,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
    marginHorizontal: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 20,
  },
  footerText: {
    color: Theme.colors.text.secondary,
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
  },
  linkText: {
    color: Theme.colors.brand.primary,
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
  },
  errorText: {
    color: Theme.colors.status.error,
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: "rgba(244, 63, 94, 0.05)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.1)",
    overflow: "hidden",
  },
});
