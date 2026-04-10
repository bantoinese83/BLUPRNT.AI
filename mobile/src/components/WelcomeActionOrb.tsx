import React from "react";
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Theme } from "../constants/Theme";

type Props = {
  label: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Action column: label centered above the circular control. */
export function WelcomeActionOrb({ label, children, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.btnSlot}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    alignSelf: "stretch",
  },
  label: {
    width: "100%",
    marginBottom: 10,
    fontSize: 11,
    fontFamily: Theme.typography.family.semibold,
    color: Theme.colors.text.onSoft,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  btnSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
});
