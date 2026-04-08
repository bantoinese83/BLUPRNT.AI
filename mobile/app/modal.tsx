import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Theme } from "../src/constants/Theme";
import { ScreenWrapper } from "../src/components/ScreenWrapper";

export default function ModalScreen() {
  return (
    <ScreenWrapper
      withScroll={false}
      withTabBar={false}
      edges={["top", "bottom"]}
    >
      <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} />
      <View style={styles.inner}>
        <Text style={styles.title}>Info</Text>
        <Text style={styles.body}>
          This modal matches the app shell. Close when you are done.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    padding: Theme.spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    gap: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.size.xxl,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    textAlign: "center",
  },
  body: {
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  button: {
    marginTop: Theme.spacing.lg,
    backgroundColor: Theme.colors.cta.from,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Theme.radius.lg,
  },
  buttonText: {
    color: Theme.colors.header,
    fontSize: Theme.typography.size.md,
    fontFamily: Theme.typography.family.bold,
  },
});
