import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import { supabase } from "../../src/lib/supabase";
import { Button } from "../../src/components/ui/Button";
import { TextField } from "../../src/components/ui/TextField";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ChevronLeft } from "lucide-react-native";
import { GoogleIcon } from "../../src/components/auth/GoogleIcon";
import { AppleSignIn } from "../../src/components/auth/AppleSignIn";
import { useAuth } from "../../src/contexts/auth-context";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { Theme } from "../../src/constants/Theme";
import { getPostAuthRedirectHref } from "../../src/lib/onboarding-draft";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMsg("Enter the email and password for your account.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const href = await getPostAuthRedirectHref();
      router.replace(href);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const error = err as Error;
      Alert.alert("Google sign-in", friendlyAuthError(error.message || ""));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScreenWrapper edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.container}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  router.back();
                }}
                style={styles.backButton}
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
                    error={
                      errorMsg && !email.trim() ? "Add your email" : undefined
                    }
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
                    <Text style={styles.forgotPasswordText}>
                      Forgot password?
                    </Text>
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
                    onStart={() => setGoogleLoading(true)}
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
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
