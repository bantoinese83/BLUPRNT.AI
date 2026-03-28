import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import {
  Mail,
  ArrowLeft,
  Wand2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";
import { Button } from "../../src/components/ui/Button";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { supabase } from "../../src/lib/supabase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Please enter your email address.");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: "bluprnt://reset-password",
        },
      );

      if (resetError) throw resetError;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.header}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft size={20} color="#94a3b8" />
                <Text style={styles.backText}>Back to Login</Text>
              </TouchableOpacity>

              <View style={styles.iconContainer}>
                <Mail size={40} color="#818cf8" />
              </View>

              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a link to get back into your
                account.
              </Text>
            </MotiView>

            {sent ? (
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard style={styles.successCard}>
                  <CheckCircle2 size={48} color="#10b981" />
                  <Text style={styles.successTitle}>Check your email</Text>
                  <Text style={styles.successSubtitle}>
                    We've sent a password reset link to {"\n"}
                    <Text style={styles.bold}>{email}</Text>
                  </Text>
                  <Button
                    title="Try another email"
                    variant="outline"
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSent(false);
                    }}
                    style={{ marginTop: 12 }}
                  />
                </GlassCard>
              </MotiView>
            ) : (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200 }}
              >
                <View style={styles.form}>
                  <View style={styles.inputContainer}>
                    <Mail size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#64748b"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (error) setError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  {error && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={16} color="#f43f5e" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <Button
                    title="Send Reset Link"
                    onPress={handleReset}
                    loading={loading}
                    icon={<Wand2 size={20} color="white" />}
                  />
                </View>
              </MotiView>
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
  },
  content: {
    padding: 24,
    justifyContent: "center",
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    marginBottom: 40,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#94a3b8",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "rgba(129, 140, 248, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.2)",
  },
  title: {
    fontSize: 28,
    fontFamily: "Outfit_700Bold",
    color: "white",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.2)",
  },
  errorText: {
    color: "#fb7185",
    fontSize: 13,
    fontFamily: "Outfit_400Regular",
    flex: 1,
  },
  successCard: {
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: "Outfit_700Bold",
    color: "white",
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  bold: {
    color: "white",
    fontFamily: "Outfit_700Bold",
  },
});
