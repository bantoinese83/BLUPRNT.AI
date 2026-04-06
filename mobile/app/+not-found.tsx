import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Theme } from "../src/constants/Theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Text style={styles.subtitle}>
          The link may be outdated or the page was removed.
        </Text>

        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={styles.button} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Go to home</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: Theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Theme.colors.text.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Theme.radius.lg,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: Theme.typography.family.bold,
  },
});
