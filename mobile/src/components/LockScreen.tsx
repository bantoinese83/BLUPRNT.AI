import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  StatusBar,
} from "react-native";
import { Theme } from "@/constants/Theme";
import {
  IOS_APP_STORE_URL,
  ANDROID_PLAY_STORE_URL,
} from "@bluprnt/shared/constants/app-links";
import { ArrowUpCircle, Lock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";

interface LockScreenProps {
  type: "update-required" | "maintenance";
}

/**
 * A full-screen blocker that prevents app usage when a critical condition
 * is met (e.g., mandatory update or backend maintenance).
 */
export function LockScreen({ type }: LockScreenProps) {
  const insets = useSafeAreaInsets();

  const handleUpdate = () => {
    const url =
      Platform.OS === "ios" ? IOS_APP_STORE_URL : ANDROID_PLAY_STORE_URL;
    void Linking.openURL(url);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {type === "update-required" ? (
            <ArrowUpCircle size={64} color={Theme.colors.brand.primary} />
          ) : (
            <Lock size={64} color={Theme.colors.brand.primary} />
          )}
        </View>

        <Text style={styles.title}>
          {type === "update-required" ? "Update Required" : "Maintenance Mode"}
        </Text>

        <Text style={styles.description}>
          {type === "update-required"
            ? "A newer version of BLUPRNT is required to continue. This ensures your data stays safe and features work correctly."
            : "BLUPRNT is currently undergoing scheduled maintenance. Please check back shortly."}
        </Text>

        {type === "update-required" && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          BlueprintAI v{Constants.expoConfig?.version || "1.0.0"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F172A", // Theme.colors.slate[900]
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(59, 130, 246, 0.1)", // brand.primary with alpha
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: Theme.typography.family.bold,
    color: "white",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Theme.typography.family.medium,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: 40,
  },
  button: {
    backgroundColor: Theme.colors.brand.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
    textAlign: "center",
  },
  footer: {
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    fontFamily: Theme.typography.family.medium,
    color: "rgba(255, 255, 255, 0.4)",
  },
});
