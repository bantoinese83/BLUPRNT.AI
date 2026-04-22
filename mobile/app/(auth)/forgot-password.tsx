import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { ChevronLeft, Wand2, CheckCircle2 } from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { TextField } from "@/components/ui/TextField";
import { supabase } from "@/lib/supabase";
import { getPasswordRecoveryRedirectUrl } from "@/lib/auth-linking";
import { Theme } from "@/constants/Theme";
import { isValidEmail } from "@/lib/validation";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmed)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmed,
        {
          redirectTo: getPasswordRecoveryRedirectUrl(),
        },
      );

      if (resetError) throw resetError;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (err) {
      const e = err as { message?: string; status?: number };
      setError(friendlyAuthError(e?.message || "", e?.status));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(auth)/login");
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
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.subtitle}>
                We’ll email you a link to choose a new password.
              </Text>
            </MotiView>

            {sent ? (
              <MotiView
                from={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: "100%" }}
              >
                <GlassCard intensity={8} style={styles.card}>
                  <View style={styles.successInner}>
                    <View style={styles.successIconWrap}>
                      <CheckCircle2
                        size={40}
                        color={Theme.colors.status.success}
                      />
                    </View>
                    <Text style={styles.successTitle}>Check your email</Text>
                    <Text style={styles.successSubtitle}>
                      If an account exists for{" "}
                      <Text style={styles.emailEmphasis}>{email}</Text>, you
                      will receive a reset link shortly.
                    </Text>
                    <Button
                      title="Try another email"
                      variant="outline"
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSent(false);
                        setError(null);
                      }}
                      style={{ marginTop: 8 }}
                    />
                    <Button
                      title="Back to sign in"
                      variant="ghost"
                      onPress={() => {
                        Haptics.selectionAsync();
                        router.replace("/(auth)/login");
                      }}
                      style={{ marginTop: 4 }}
                    />
                  </View>
                </GlassCard>
              </MotiView>
            ) : (
              <GlassCard intensity={8} style={styles.card}>
                <View style={styles.form}>
                  <TextField
                    label="Email address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError(null);
                    }}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={error ?? undefined}
                  />

                  <Button
                    title="Send reset link"
                    onPress={handleReset}
                    loading={loading}
                    icon={<Wand2 size={20} color="white" />}
                  />
                </View>
              </GlassCard>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.05)",
    width: "100%",
  },
  form: {
    width: "100%",
    gap: 4,
  },
  successInner: {
    alignItems: "center",
    gap: 12,
  },
  successIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  emailEmphasis: {
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.primary,
  },
});
