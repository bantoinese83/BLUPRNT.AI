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
import { supabase } from "../../src/lib/supabase";
import { Button } from "../../src/components/ui/Button";
import { TextField } from "../../src/components/ui/TextField";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ChevronLeft, Check } from "lucide-react-native";
import { GoogleIcon } from "../../src/components/auth/GoogleIcon";
import { AppleSignIn } from "../../src/components/auth/AppleSignIn";
import { useAuth } from "../../src/contexts/auth-context";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { Theme } from "../../src/constants/Theme";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";
import { getPostAuthRedirectHref } from "../../src/lib/onboarding-draft";

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
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
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
        email,
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
                          router.push("/terms");
                        }}
                      >
                        Terms
                      </Text>{" "}
                      and{" "}
                      <Text
                        style={styles.policyLink}
                        onPress={() => {
                          Haptics.selectionAsync();
                          router.push("/privacy");
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
                    disabled={!acceptedPolicies}
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
                    disabled={!acceptedPolicies}
                    style={{ marginTop: 0 }}
                  />

                  <AppleSignIn
                    disabled={!acceptedPolicies}
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
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    marginBottom: 32,
    marginTop: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontFamily: "Outfit_800ExtraBold",
    color: "white",
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textAlign: "center",
  },
  formCard: {
    padding: 24,
    borderRadius: 24,
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
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  policyCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
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
    color: "#94a3b8",
    lineHeight: 20,
  },
  policyLink: {
    color: "#5eead4",
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    color: "#94a3b8",
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
    color: "#94a3b8",
    fontFamily: "Outfit_400Regular",
    fontSize: 14,
  },
  linkText: {
    color: "white",
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
  },
  errorText: {
    color: "#f43f5e",
    fontSize: 13,
    fontFamily: "Outfit_600SemiBold",
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.2)",
    overflow: "hidden",
  },
});
