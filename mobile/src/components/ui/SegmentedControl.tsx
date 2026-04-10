import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleProp,
  ViewStyle,
} from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Theme } from "../../constants/Theme";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  containerStyle,
}: Props) {
  const activeIndex = options.findIndex((opt) => opt.value === value);
  const itemWidth = (Dimensions.get("window").width - 48 - 8) / options.length;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Sliding Backdrop */}
      <MotiView
        animate={{
          translateX: activeIndex * itemWidth,
        }}
        transition={{
          type: "timing",
          duration: 200,
        }}
        style={[styles.activeBackdrop, { width: itemWidth }]}
      />

      {/* Options */}
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              if (!isActive) {
                Haptics.selectionAsync();
                onChange(option.value);
              }
            }}
            style={[styles.option, { width: itemWidth }]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    borderRadius: 14,
    padding: 4,
    height: 48,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.08)",
  },
  activeBackdrop: {
    position: "absolute",
    height: 38,
    backgroundColor: "white",
    borderRadius: 10,
    left: 4,
  },
  option: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontFamily: "Outfit_700Bold",
  },
  activeLabel: {
    color: Theme.colors.text.primary,
  },
  inactiveLabel: {
    color: "#64748b", // Slate-500
  },
});
