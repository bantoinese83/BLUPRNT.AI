import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

import { Theme } from "../constants/Theme";
import iconMark from "../../assets/images/icon.png";

/**
 * Shown while fonts load. Uses the real app icon + wordmark so this never depends
 * on a mislabeled/template raster. Native splash (Expo Go vs dev build) is explained
 * in app config comments.
 */
export function BrandedSplash() {
  const { width } = Dimensions.get("window");
  const size = Math.min(width * 0.42, 168);

  return (
    <View style={styles.root}>
      <Image
        source={iconMark}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        resizeMode="cover"
        accessibilityLabel="BLUPRNT logo"
      />
      <Text style={styles.wordmark}>BLUPRNT</Text>
      <Text style={styles.submark}>AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    marginTop: 20,
    fontSize: 28,
    fontFamily: Theme.typography.family.black,
    color: Theme.colors.text.primary,
    letterSpacing: 4,
  },
  submark: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: Theme.typography.family.bold,
    color: Theme.colors.text.secondary,
    letterSpacing: 6,
  },
});
