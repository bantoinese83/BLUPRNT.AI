import React, { useState, useEffect } from "react";
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
import {
  ChevronLeft,
  CheckCircle2,
  Lock,
  AlertCircle,
} from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { Button } from "../../src/components/ui/Button";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { TextField } from "../../src/components/ui/TextField";
import { supabase } from "../../src/lib/supabase";
import { Theme } from "../../src/constants/Theme";

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function waitForSession() {
      try {
        let session = (await supabase.auth.getSession()).data.session;
        for (let i = 0; i < 10 && !session && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 150));
          session = (await supabase.auth.getSession()).data.session;
        }
        if (cancelled) return;
        const ok = Boolean(session);
        setSessionOk(ok);
        if (!ok) {
          setError(
            "This reset link may have expired. Request a new one from the sign-in page.",
          );
        }
      } catch {
        if (!cancelled) {
          setSessionOk(false);
          setError("Could not verify your session. Please try again.");
        }
      }
    }

    void waitForSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    setError(null);

    if (sessionOk === false) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message || "Could not update your password. Try again.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSuccess(true);
    setTimeout(() => {
      router.replace("/(auth)/login");
    }, 2500);
  };

  const blockSubmit = sessionOk === false;

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
              <View style={styles.iconWrap}>
                <Lock size={32} color={Theme.colors.brand.primary} />
              </View>
              <Text style={styles.title}>Choose a new password</Text>
              <Text style={styles.subtitle}>
                Use at least 8 characters you have not used elsewhere.
              </Text>
            </MotiView>

            {success ? (
              <GlassCard intensity={8} style={styles.card}>
                <View style={styles.successInner}>
                  <CheckCircle2 size={48} color={Theme.colors.status.success} />
                  <Text style={styles.successTitle}>Password updated</Text>
                  <Text style={styles.successSubtitle}>
                    Taking you back to sign in…
                  </Text>
                </View>
              </GlassCard>
            ) : (
              <GlassCard intensity={8} style={styles.card}>
                <View style={styles.form}>
                  <TextField
                    label="New password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (sessionOk) setError(null);
                    }}
                    placeholder="Minimum 8 characters"
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  <TextField
                    label="Confirm password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (sessionOk) setError(null);
                    }}
                    placeholder="Repeat your password"
                    secureTextEntry
                    autoCapitalize="none"
                  />

                  {error ? (
                    <View style={styles.errorBox}>
                      <AlertCircle
                        size={18}
                        color={Theme.colors.status.error}
                        style={styles.errorIcon}
                      />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <Button
                    title="Update password"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={blockSubmit || sessionOk === null}
                    style={{ marginTop: 8 }}
                  />

                  {blockSubmit ? (
                    <Button
                      title="Request a new link"
                      variant="outline"
                      onPress={() => {
                        Haptics.selectionAsync();
                        router.replace("/(auth)/forgot-password");
                      }}
                      style={{ marginTop: 4 }}
                    />
                  ) : null}
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
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.15)",
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit_800ExtraBold",
    color: Theme.colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Outfit_400Regular",
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
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
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(244, 63, 94, 0.06)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.12)",
    marginTop: 8,
  },
  errorIcon: {
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    color: Theme.colors.status.error,
    fontSize: 13,
    fontFamily: Theme.typography.family.medium,
    lineHeight: 18,
  },
  successInner: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
});
