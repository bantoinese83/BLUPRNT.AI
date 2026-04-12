import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Settings } from "lucide-react-native";
import { Theme } from "@/constants/Theme";
import { Button } from "@/components/ui/Button";

type Props = {
  onRetry?: () => void;
};

export function ConfigurationRequired({ onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Settings size={40} color={Theme.colors.brand.primary} />
      </View>
      <Text style={styles.title}>{"Can't connect right now"}</Text>
      <Text style={styles.body}>
        {
          "This build isn't reaching BLUPRNT yet. Check your connection, try again, or contact support if it continues."
        }
      </Text>
      <Text style={styles.hint}>
        This usually means the app wasn’t configured with backend settings, or
        something on your network is blocking the connection.
      </Text>
      {__DEV__ && (
        <Text style={styles.dev}>
          Development: set EXPO_PUBLIC_SUPABASE_URL and
          EXPO_PUBLIC_SUPABASE_ANON_KEY for this app target.
        </Text>
      )}
      {onRetry ? (
        <Button title="Try again" onPress={onRetry} style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  title: {
    fontSize: 22,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.primary,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  hint: {
    fontSize: 13,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.muted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  dev: {
    fontSize: 12,
    fontFamily: Theme.typography.family.regular,
    color: Theme.colors.text.muted,
    textAlign: "center",
    maxWidth: 320,
  },
  btn: {
    marginTop: 8,
    minWidth: 200,
  },
});
