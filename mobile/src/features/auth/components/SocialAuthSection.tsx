import React from "react";
import { StyleSheet, View, Text, Alert } from "react-native";
import { Button } from "@/components/ui/Button";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { AppleSignIn } from "@/components/auth/AppleSignIn";
import { Theme } from "@/constants/Theme";
import { friendlyAuthError } from "@shared/lib/user-friendly-errors";

interface SocialAuthSectionProps {
  googleLoading: boolean;
  onGoogleLogin: () => void;
  onAppleStart: () => void;
  onAppleSuccess: () => void;
  policyAccepted?: boolean;
  redirectParams?: string | string[];
}

export function SocialAuthSection({
  googleLoading,
  onGoogleLogin,
  onAppleStart,
  onAppleSuccess,
  policyAccepted = true,
}: SocialAuthSectionProps) {
  return (
    <>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        title="Continue with Google"
        onPress={onGoogleLogin}
        loading={googleLoading}
        variant="outline"
        icon={<GoogleIcon />}
        style={{ marginTop: 0 }}
      />

      <AppleSignIn
        policyAccepted={policyAccepted}
        busy={googleLoading}
        onStart={onAppleStart}
        onSuccess={onAppleSuccess}
        onError={(err) => {
          onAppleSuccess(); // End loading
          Alert.alert("Apple sign-in", friendlyAuthError(err.message || ""));
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
});
