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
  Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { GlassCard } from "@/components/ui/GlassCard";
import { ChevronLeft, Check } from "lucide-react-native";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { AppleSignIn } from "@/components/auth/AppleSignIn";
import { useAuth } from "@/contexts/auth-context";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Theme } from "@/constants/Theme";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import {
  WEB_APP_PATH_PRIVACY,
  WEB_APP_PATH_TERMS,
} from "@shared/constants/public-site";
import { getPostAuthRedirectHref } from "@/lib/onboarding-draft";
import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
} from "@/lib/validation";

export default function RegisterScreen() {
  const { signInWithGoogle } = useAuth();
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
      const href = await getPostAuthRedirectHref();
      setLoading(false);
      router.replace(href);
      return;
    }

    if (data.user) {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInData.session) {
        const href = await getPostAuthRedirectHref();
        setLoading(false);
        router.replace(href);
        return;
      }
    }

    setLoading(false);
    const emailParam = email.trim();
    Alert.alert(
      "Check your email",
      "We sent a confirmation link. After you confirm, sign in with your password.",
      [
        {
          text: "OK",
          onPress: () =>
            router.replace({
              pathname: "/(auth)/login",
              params: { email: emailParam },
            }),
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
      withTabBar={false}
      edges={["top", "bottom", "left", "right"]}
    >
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
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>Join BLUPRNT today</Text>
              </MotiView>

              <GlassCard intensity={10} style={styles.formCard}>
                <View style={styles.form}>
                  <View style={styles.policyRow}>
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync();
                        setAcceptedPolicies((v) => !v);
                      }}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: acceptedPolicies }}
                      hitSlop={8}
                    >
                      <View
                        style={[
                          styles.policyCheck,
                          acceptedPolicies && styles.policyCheckOn,
                        ]}
                      >
                        {acceptedPolicies ? (
                          <Check size={14} color="#fff" strokeWidth={3} />
                        ) : null}
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
                    policyAccepted={acceptedPolicies}
                    busy={googleLoading}
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
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push("/(auth)/login");
                  }}
                >
                  <Text style={styles.linkText}>Sign In</Text>
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
