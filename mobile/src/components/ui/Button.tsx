import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Theme } from "../../constants/Theme";

interface Props {
  onPress: () => Promise<void> | void;
  title: string;
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

export function Button({
  onPress,
  title,
  variant = "primary",
  loading = false,
  icon,
  style,
  disabled = false,
}: Props) {
  const isInteractionDisabled = loading || disabled;

  const handlePress = () => {
    if (isInteractionDisabled) return;

    // Use medium haptic for the primary action to feel "heavier" and more purposeful
    if (variant === "primary") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  };

  if (variant === "primary") {
    return (
      <View style={[styles.shadowContainer, style]}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={isInteractionDisabled}
          activeOpacity={0.9}
        >
          <MotiView
            animate={{
              scale: isInteractionDisabled ? 0.98 : 1,
              opacity: isInteractionDisabled ? 0.6 : 1,
            }}
            transition={{ type: "timing", duration: 150 }}
            style={styles.button}
          >
            <LinearGradient
              colors={[Theme.colors.brand.primary, Theme.colors.brand.deep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.text}>{title}</Text>
                  {icon && <View style={styles.icon}>{icon}</View>}
                </>
              )}
            </View>
          </MotiView>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isInteractionDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        variant === "outline" ? styles.outline : styles.ghost,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={Theme.colors.brand.primary} />
        ) : (
          <>
            <Text
              style={[
                styles.text,
                variant === "outline" || variant === "ghost"
                  ? styles.textBrand
                  : {},
                isInteractionDisabled ? { opacity: 0.5 } : {},
              ]}
            >
              {title}
            </Text>
            {icon && <View style={styles.icon}>{icon}</View>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: Theme.colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  button: {
    height: 56,
    borderRadius: Theme.radius.lg,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: Theme.spacing.padding,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: "rgba(79, 70, 229, 0.4)",
    backgroundColor: Theme.colors.brand.primary + "10",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.black,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  textBrand: {
    color: Theme.colors.brand.light,
  },
  icon: {
    marginLeft: 8,
  },
});
