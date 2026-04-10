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
  textSize?: number;
  /** Overrides visible title for screen readers when needed */
  accessibilityLabel?: string;
  /** Primary buttons default to uppercase; use `sentence` to match web-style labels (e.g. “Continue”). */
  titleCase?: "uppercase" | "sentence";
}

export function Button({
  onPress,
  title,
  variant = "primary",
  loading = false,
  icon,
  style,
  disabled = false,
  textSize,
  accessibilityLabel,
  titleCase = "uppercase",
}: Props) {
  const a11yLabel = accessibilityLabel ?? title;
  const primaryTextStyle =
    titleCase === "sentence" ? styles.textPrimarySentence : styles.text;
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
      <View style={[styles.shadowContainer, { flex: style?.flex }]}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={isInteractionDisabled}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
          accessibilityState={{ disabled: isInteractionDisabled }}
        >
          <MotiView
            animate={{
              scale: isInteractionDisabled ? 0.98 : 1,
              opacity: isInteractionDisabled ? 0.6 : 1,
            }}
            transition={{ type: "timing", duration: 150 }}
            style={[styles.button, style]}
          >
            <LinearGradient
              colors={[Theme.colors.cta.from, Theme.colors.cta.to]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text
                    style={[
                      primaryTextStyle,
                      textSize ? { fontSize: textSize } : {},
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {title}
                  </Text>
                  {icon && (
                    <View
                      style={[
                        styles.icon,
                        title ? { marginLeft: Theme.spacing.xs } : {},
                      ]}
                    >
                      {icon}
                    </View>
                  )}
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
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled: isInteractionDisabled }}
      style={[
        styles.button,
        variant === "outline" ? styles.outline : styles.ghost,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={Theme.colors.cta.from} />
        ) : (
          <>
            <Text
              style={[
                styles.text,
                variant === "outline"
                  ? styles.textOutline
                  : variant === "ghost"
                    ? styles.textGhost
                    : {},
                titleCase === "sentence" && styles.titleSentenceMixin,
                isInteractionDisabled ? { opacity: 0.5 } : {},
                textSize ? { fontSize: textSize } : {},
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {title}
            </Text>
            {icon && (
              <View
                style={[
                  styles.icon,
                  title ? { marginLeft: Theme.spacing.xs } : {},
                ]}
              >
                {icon}
              </View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: Theme.colors.cta.from,
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
    borderColor: "rgba(15, 23, 42, 0.2)",
    backgroundColor: "rgba(15, 23, 42, 0.04)",
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
  textPrimarySentence: {
    color: "white",
    fontSize: Theme.typography.size.lg,
    fontFamily: Theme.typography.family.bold,
    letterSpacing: 0.2,
    textTransform: "none",
  },
  /** Outline/ghost: strip uppercase while keeping their color + weight from textOutline/textGhost */
  titleSentenceMixin: {
    textTransform: "none",
    letterSpacing: 0.2,
  },
  /** Secondary control — visible but subservient to primary CTA */
  textOutline: {
    color: Theme.colors.text.primary,
    fontFamily: Theme.typography.family.semibold,
  },
  /** Lowest priority — steps back (muted, lighter weight) */
  textGhost: {
    color: Theme.colors.text.muted,
    fontFamily: Theme.typography.family.medium,
  },
  icon: {
    // No margin if there's no text to separate from
  },
});
