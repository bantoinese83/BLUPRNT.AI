import React from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";

import splashArt from "../../assets/images/splash-screen.png";

/**
 * Shown while fonts load. Matches `app.json` splash so Expo Go / dev builds
 * show BLUPRNT branding instead of relying only on the native layer (which
 * Expo Go may not apply the same as standalone builds).
 */
export function BrandedSplash() {
  const { width } = Dimensions.get("window");
  const size = Math.min(width * 0.78, 340);

  return (
    <View style={styles.root}>
      <Image
        source={splashArt}
        style={{ width: size, height: size * 1.15 }}
        resizeMode="contain"
        accessibilityLabel="BLUPRNT"
      />
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
});
