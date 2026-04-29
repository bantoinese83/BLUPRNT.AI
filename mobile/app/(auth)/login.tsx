import React, { useState, useEffect } from "react";
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
import { MotiView } from "moti";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChevronLeft } from "lucide-react-native";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { AppleSignIn } from "@/components/auth/AppleSignIn";
import { useAuth } from "@/contexts/auth-context";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Theme } from "@/constants/Theme";
import { getPostAuthRedirectHref } from "@/lib/onboarding-draft";
import { getSafeRedirect } from "@shared/lib/safe-redirect";
import {
  clearPostLoginRedirectStorage,
  persistPostLoginRedirectForOAuth,
} from "@/lib/post-login-redirect-storage";
import {
  friendlyAuthError,
  friendlyAuthErrorFromUrlParam,
} from "@shared/lib/user-friendly-errors";
import { isValidEmail } from "@/lib/validation";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const params = useLocalSearchParams<{
    email?: string | string[];
    error?: string | string[];
    redirect?: string | string[];
  }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const raw = params.email;
    const e = Array.isArray(raw) ? raw[0] : raw;
    if (!e || typeof e !== "string") return;
    try {
      setEmail(decodeURIComponent(e.trim()));
    } catch {
      setEmail(e.trim());
    }
  }, [params.email]);

  useEffect(() => {
    const fromUrl = friendlyAuthErrorFromUrlParam(params.error);
    if (fromUrl) {
      setErrorMsg(fromUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [params.error]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMsg("Enter the email and password for your account.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMsg("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorMsg(
          friendlyAuthError(
            error.message || "",
            "status" in error
              ? (error as { status?: number }).status
              : undefined,
          ),
        );
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await clearPostLoginRedirectStorage();
      const fallback = await getPostAuthRedirectHref();
      const rawRedirect = Array.isArray(params.redirect)
        ? params.redirect[0]
        : params.redirect;
      const target = rawRedirect?.trim()
        ? getSafeRedirect(rawRedirect.trim(), fallback)
        : fallback;
      router.replace(target as never);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      edges={["top", "bottom", "left", "right"]}
      contentContainerStyle={styles.scrollContent}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container} testID="auth-login-screen">
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

          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800 }}
            style={styles.header}
          >
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </MotiView>

          <GlassCard intensity={8} style={styles.formCard}>
            <View style={styles.form}>
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
                error={errorMsg && !email.trim() ? "Add your email" : undefined}
              />

              <TextField
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter your password"
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push("/(auth)/forgot-password");
                }}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>

              {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={{ marginTop: 8 }}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title="Continue with Google"
                onPress={handleGoogleLogin}
                loading={googleLoading}
                variant="outline"
                icon={<GoogleIcon />}
                style={{ marginTop: 0 }}
              />

              <AppleSignIn
                onStart={() => {
                  setGoogleLoading(true);
                  void persistPostLoginRedirectForOAuth(params.redirect);
                }}
                onSuccess={() => setGoogleLoading(false)}
                onError={(err) => {
                  setGoogleLoading(false);
                  Alert.alert(
                    "Apple sign-in",
                    friendlyAuthError(err.message || ""),
                  );
                }}
              />
            </View>
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(auth)/register");
              }}
            >
              <Text style={styles.linkText}>Create one</Text>
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Theme.colors.brand.primary,
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
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
