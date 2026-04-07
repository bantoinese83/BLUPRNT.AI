import {
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../contexts/auth-context";

interface Props {
  onStart?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  style?: StyleProp<ViewStyle>;
}

export function AppleSignIn({ onStart, onSuccess, onError, style }: Props) {
  const { signInWithApple } = useAuth();

  const handleAppleSignIn = async () => {
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
