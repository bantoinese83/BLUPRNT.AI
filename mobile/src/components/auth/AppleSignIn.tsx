import {
  StyleSheet,
  Platform,
  Alert,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/auth-context";

interface Props {
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  style?: StyleProp<ViewStyle>;
  /** When false, shows an alert instead of starting Apple (e.g. register until terms are accepted). Default true for sign-in screens. */
  policyAccepted?: boolean;
  /** Blocks starting another OAuth flow (e.g. shared loading with Google). */
  busy?: boolean;
}

export function AppleSignIn({
  onStart,
  onSuccess,
  onError,
  style,
  policyAccepted = true,
  busy = false,
}: Props) {
  const { signInWithApple } = useAuth();

  const handleAppleSignIn = async () => {
    if (busy) return;
    if (!policyAccepted) {
      Alert.alert(
        "Terms and privacy",
        "Please agree to the Terms and Privacy Policy first.",
      );
      return;
    }
    onStart?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await signInWithApple();
      onSuccess?.();
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "ERR_REQUEST_CANCELED"
      ) {
        onSuccess?.();
        return;
      }
      onError?.(err as Error);
    }
  };

  if (Platform.OS !== "ios") return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={[styles.button, style]}
      onPress={handleAppleSignIn}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 56,
    marginTop: 12,
  },
});
