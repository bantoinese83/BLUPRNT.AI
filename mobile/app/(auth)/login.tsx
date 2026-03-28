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
} from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import { supabase } from "../../src/lib/supabase";
import { Button } from "../../src/components/ui/Button";
import { TextField } from "../../src/components/ui/TextField";
import { GlassCard } from "../../src/components/ui/GlassCard";
import { ChevronLeft } from "lucide-react-native";
import { GoogleIcon } from "../../src/components/auth/GoogleIcon";
import { useAuth } from "../../src/contexts/auth-context";
import { ScreenWrapper } from "../../src/components/ScreenWrapper";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Login Failed", error.message);
      setLoading(false);
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const error = err as Error;
      Alert.alert(
        "Google Auth Failed",
        error.message || "Could not sign in with Google",
      );
    } finally {
      setGoogleLoading(false);
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
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ChevronLeft size={24} color="white" />
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

            <GlassCard intensity={10} style={styles.formCard}>
              <View style={styles.form}>
                <TextField
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
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
              </View>
            </GlassCard>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.linkText}>Create one</Text>
              </TouchableOpacity>
            </View>
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
    top: 20,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 32,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#94a3b8",
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
});
